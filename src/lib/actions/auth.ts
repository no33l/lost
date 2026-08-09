"use server";

// Auth-Flows: Registrieren, Login, 2FA-Challenge.
// Alle Actions liefern ActionState (für useActionState) oder redirecten bei Erfolg.

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  getCurrentSession,
  isTwoFactorRequired,
  markCurrentSessionTwoFactorVerified,
} from "@/lib/session";
import { checkAuthRateLimit, rateLimit } from "@/lib/rate-limit";
import { errorState, fromZodError, successState, type ActionState } from "@/lib/action-state";
import { displayNameSchema, emailSchema, passwordSchema } from "@/lib/validation";
import { decryptTotpSecret, hashRecoveryCode, verifyTotp } from "@/lib/totp";
import { ROLES } from "@/lib/rbac";

const registerSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passwordConfirm"],
        message: "Die Passwörter stimmen nicht überein.",
      });
    }
  });

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limited = await checkAuthRateLimit("register");
  if (limited) return errorState(limited);

  const parsed = registerSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { displayName, email, password } = parsed.data;

  const alreadyTaken = errorState("Unter dieser E-Mail gibt es schon ein Konto.", {
    email: ["Unter dieser E-Mail gibt es schon ein Konto - magst du dich stattdessen einloggen?"],
  });

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return alreadyTaken;

  let userId: string;
  try {
    const user = await db.user.create({
      data: {
        email,
        displayName,
        passwordHash: bcrypt.hashSync(password, 12),
        role: ROLES.CLIENT,
      },
    });
    userId = user.id;
  } catch (error) {
    // Race auf das Unique-Constraint (P2002) freundlich abfangen.
    if ((error as { code?: string })?.code === "P2002") return alreadyTaken;
    throw error;
  }

  await createSession(userId, { twoFactorVerified: true });
  redirect("/plattform");
}

const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Passwort fehlt." })
    .min(1, "Passwort fehlt."),
});

/** Nur relative Pfade als Redirect-Ziel zulassen (Open-Redirect-Schutz). */
function safeNextPath(raw: unknown): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/plattform";
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limited = await checkAuthRateLimit("login");
  if (limited) return errorState(limited);

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { email, password } = parsed.data;

  // Zusätzlich pro E-Mail limitieren, damit gezieltes Durchprobieren nicht klappt.
  const perEmail = rateLimit(`login:${email}`, 5, 15 * 60_000);
  if (!perEmail.ok) {
    const minutes = Math.max(1, Math.ceil(perEmail.retryAfterSec / 60));
    return errorState(
      `Zu viele Versuche für diese E-Mail. Bitte warte ca. ${minutes} Minute${minutes === 1 ? "" : "n"}.`
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    // Bewusst generisch - verrät nicht, ob die E-Mail existiert.
    return errorState("E-Mail oder Passwort stimmt nicht.");
  }

  // Skip TOTP challenge when DISABLE_2FA_REQUIREMENT=true (local testing).
  if (user.twoFactorEnabled && isTwoFactorRequired()) {
    await createSession(user.id, { twoFactorVerified: false });
    redirect("/login/2fa");
  }

  await createSession(user.id, { twoFactorVerified: true });
  redirect(safeNextPath(formData.get("next")));
}

const RECOVERY_CODE_PATTERN = /^[a-z0-9]{4}-[a-z0-9]{4}$/i;

export async function verifyTwoFactorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await getCurrentSession();
  if (!auth) redirect("/login");
  const { session, user } = auth;
  if (session.twoFactorVerified || !user.twoFactorEnabled) redirect("/plattform");

  const limited = rateLimit(`2fa:${user.id}`, 8, 5 * 60_000);
  if (!limited.ok) {
    const minutes = Math.max(1, Math.ceil(limited.retryAfterSec / 60));
    return errorState(
      `Zu viele Versuche. Bitte warte ca. ${minutes} Minute${minutes === 1 ? "" : "n"}.`
    );
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return errorState("Bitte gib einen Code ein.");

  // Format xxxx-xxxx => Recovery-Code, sonst TOTP.
  if (RECOVERY_CODE_PATTERN.test(code)) {
    const record = await db.recoveryCode.findFirst({
      where: { userId: user.id, codeHash: hashRecoveryCode(code), usedAt: null },
    });
    if (!record) {
      return errorState("Dieser Recovery-Code ist ungültig oder wurde schon verwendet.");
    }
    await db.recoveryCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await markCurrentSessionTwoFactorVerified(session.id);
    return successState(
      "Dieser Recovery-Code ist jetzt verbraucht - streich ihn von deiner Liste. Neue Codes kannst du jederzeit unter Sicherheit erzeugen."
    );
  }

  if (!user.twoFactorSecret || !verifyTotp(code, decryptTotpSecret(user.twoFactorSecret))) {
    return errorState(
      "Der Code stimmt nicht. Prüfe, ob dein Gerät die richtige Uhrzeit hat, und versuch es nochmal."
    );
  }

  await markCurrentSessionTwoFactorVerified(session.id);
  redirect("/plattform");
}
