"use server";

// 2FA-Verwaltung (Setup, Recovery-Codes, Deaktivieren) und Passwort-Änderung.
// Guards laufen über getCurrentSession, damit manipulierte Requests saubere
// Fehlermeldungen statt Redirects bekommen.

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  destroyAllSessions,
  destroyCurrentSession,
  getCurrentSession,
  isSessionTwoFactorOk,
  markCurrentSessionTwoFactorVerified,
  type Auth,
} from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { errorState, fromZodError, successState, type ActionState } from "@/lib/action-state";
import { passwordSchema } from "@/lib/validation";
import {
  buildOtpAuthUrl,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  totpQrDataUrl,
  verifyTotp,
} from "@/lib/totp";
import { ROLES } from "@/lib/rbac";

export type TwoFactorSetupResult =
  | { ok: true; secret: string; otpauthUrl: string; qrDataUrl: string }
  | { ok: false; message: string };

export type RecoveryCodesResult =
  | { ok: true; recoveryCodes: string[] }
  | { ok: false; message: string };

type Guard = { ok: true; auth: Auth } | { ok: false; message: string };

async function guardAction(): Promise<Guard> {
  const auth = await getCurrentSession();
  if (!auth) return { ok: false, message: "Bitte melde dich an." };
  if (!isSessionTwoFactorOk(auth)) {
    return { ok: false, message: "Bitte bestätige zuerst deinen Login mit deinem 2FA-Code." };
  }
  return { ok: true, auth };
}

function tooMany(retryAfterSec: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `Zu viele Versuche. Bitte warte ca. ${minutes} Minute${minutes === 1 ? "" : "n"}.`;
}

/**
 * Schritt 1 des Setups: Secret erzeugen und (verschlüsselt) am User speichern.
 * twoFactorEnabled bleibt false, bis der erste Code bestätigt wurde.
 */
export async function startTwoFactorSetup(): Promise<TwoFactorSetupResult> {
  const guard = await guardAction();
  if (!guard.ok) return { ok: false, message: guard.message };
  const { user } = guard.auth;

  if (user.twoFactorEnabled) {
    return { ok: false, message: "2FA ist bereits aktiv." };
  }

  const limited = rateLimit(`2fa-setup:${user.id}`, 10, 15 * 60_000);
  if (!limited.ok) return { ok: false, message: tooMany(limited.retryAfterSec) };

  const secret = generateTotpSecret();
  const otpauthUrl = buildOtpAuthUrl(user.email, secret);
  const qrDataUrl = await totpQrDataUrl(otpauthUrl);

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: encryptTotpSecret(secret) },
  });

  return { ok: true, secret, otpauthUrl, qrDataUrl };
}

/**
 * Schritt 2: Code aus der App bestätigen. Aktiviert 2FA, erzeugt Recovery-Codes
 * (Klartext geht genau einmal zurück an die UI) und markiert die laufende
 * Session sofort als 2FA-verifiziert.
 */
export async function confirmTwoFactorSetup(code: string): Promise<RecoveryCodesResult> {
  const guard = await guardAction();
  if (!guard.ok) return { ok: false, message: guard.message };
  const { user, session } = guard.auth;

  if (user.twoFactorEnabled) return { ok: false, message: "2FA ist bereits aktiv." };
  if (!user.twoFactorSecret) {
    return { ok: false, message: "Kein Setup gestartet. Bitte beginne mit Schritt 1." };
  }

  const limited = rateLimit(`2fa-confirm:${user.id}`, 8, 5 * 60_000);
  if (!limited.ok) return { ok: false, message: tooMany(limited.retryAfterSec) };

  if (!verifyTotp(String(code ?? ""), decryptTotpSecret(user.twoFactorSecret))) {
    return {
      ok: false,
      message:
        "Der Code stimmt nicht. Prüfe, ob dein Gerät die richtige Uhrzeit hat, und versuch es nochmal.",
    };
  }

  const recoveryCodes = generateRecoveryCodes(8);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } }),
    db.recoveryCode.deleteMany({ where: { userId: user.id } }),
    db.recoveryCode.createMany({
      data: recoveryCodes.map((recoveryCode) => ({
        userId: user.id,
        codeHash: hashRecoveryCode(recoveryCode),
      })),
    }),
  ]);
  await markCurrentSessionTwoFactorVerified(session.id);

  revalidatePath("/plattform/sicherheit");
  return { ok: true, recoveryCodes };
}

/** Neue Recovery-Codes erzeugen - bestätigt mit einem aktuellen TOTP-Code. */
export async function regenerateRecoveryCodes(code: string): Promise<RecoveryCodesResult> {
  const guard = await guardAction();
  if (!guard.ok) return { ok: false, message: guard.message };
  const { user } = guard.auth;

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return { ok: false, message: "2FA ist nicht aktiv." };
  }

  const limited = rateLimit(`2fa-regen:${user.id}`, 8, 5 * 60_000);
  if (!limited.ok) return { ok: false, message: tooMany(limited.retryAfterSec) };

  if (!verifyTotp(String(code ?? ""), decryptTotpSecret(user.twoFactorSecret))) {
    return { ok: false, message: "Der Code stimmt nicht. Versuch es nochmal." };
  }

  const recoveryCodes = generateRecoveryCodes(8);
  await db.$transaction([
    db.recoveryCode.deleteMany({ where: { userId: user.id } }),
    db.recoveryCode.createMany({
      data: recoveryCodes.map((recoveryCode) => ({
        userId: user.id,
        codeHash: hashRecoveryCode(recoveryCode),
      })),
    }),
  ]);

  return { ok: true, recoveryCodes };
}

/**
 * 2FA deaktivieren - nur für Klient:innen. Für Berater:innen und Admins ist
 * 2FA verpflichtend; die Verweigerung passiert hart serverseitig.
 */
export async function disableTwoFactorAction(password: string): Promise<ActionState> {
  const guard = await guardAction();
  if (!guard.ok) return errorState(guard.message);
  const { user } = guard.auth;

  if (user.role !== ROLES.CLIENT) {
    return errorState(
      "Für Berater:innen und Admins ist 2FA verpflichtend und kann nicht deaktiviert werden."
    );
  }
  if (!user.twoFactorEnabled) return errorState("2FA ist nicht aktiv.");

  const limited = rateLimit(`2fa-disable:${user.id}`, 5, 15 * 60_000);
  if (!limited.ok) return errorState(tooMany(limited.retryAfterSec));

  if (!password || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return errorState("Das Passwort stimmt nicht.");
  }

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    }),
    db.recoveryCode.deleteMany({ where: { userId: user.id } }),
  ]);

  revalidatePath("/plattform/sicherheit");
  return successState("2FA ist deaktiviert. Dein Konto schützt jetzt nur noch dein Passwort.");
}

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Bitte gib dein aktuelles Passwort ein." })
      .min(1, "Bitte gib dein aktuelles Passwort ein."),
    newPassword: passwordSchema,
    newPasswordConfirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.newPasswordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPasswordConfirm"],
        message: "Die Passwörter stimmen nicht überein.",
      });
    }
    if (data.currentPassword && data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "Das neue Passwort sollte sich vom alten unterscheiden.",
      });
    }
  });

/**
 * Passwort ändern - meldet danach alle Geräte ab (inkl. dieses) und leitet
 * zum Login mit Erfolgshinweis.
 */
export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const guard = await guardAction();
  if (!guard.ok) return errorState(guard.message);
  const { user } = guard.auth;

  const limited = rateLimit(`pw-change:${user.id}`, 5, 15 * 60_000);
  if (!limited.ok) return errorState(tooMany(limited.retryAfterSec));

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    newPasswordConfirm: String(formData.get("newPasswordConfirm") ?? ""),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { currentPassword, newPassword } = parsed.data;

  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return errorState("Bitte prüfe deine Eingaben.", {
      currentPassword: ["Das aktuelle Passwort stimmt nicht."],
    });
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: bcrypt.hashSync(newPassword, 12) },
  });

  // Sicherheitsprinzip: Nach Passwort-Änderung ist überall Schluss.
  await destroyAllSessions(user.id);
  await destroyCurrentSession();
  redirect("/login?hinweis=passwort-geaendert");
}
