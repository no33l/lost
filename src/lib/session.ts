import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import type { Session, User } from "@prisma/client";
import { db } from "./db";
import { sha256 } from "./crypto";
import { ROLES, type Role } from "./rbac";

export const SESSION_COOKIE = "lost_session";
const SESSION_DAYS = 30;

/**
 * Local-testing escape hatch. Set `DISABLE_2FA_REQUIREMENT=true` in `.env`
 * so advisors/admins can use sensitive features without TOTP setup.
 * Never enable this in production.
 */
export function isTwoFactorRequired(): boolean {
  return process.env.DISABLE_2FA_REQUIREMENT !== "true";
}

/** True if the session has passed any required TOTP challenge. */
export function isSessionTwoFactorOk(auth: {
  user: { twoFactorEnabled: boolean };
  session: { twoFactorVerified: boolean };
}): boolean {
  if (!isTwoFactorRequired()) return true;
  if (!auth.user.twoFactorEnabled) return true;
  return auth.session.twoFactorVerified;
}

/** True if the user has 2FA enabled when the app still requires it. */
export function hasRequiredTwoFactor(user: { twoFactorEnabled: boolean }): boolean {
  if (!isTwoFactorRequired()) return true;
  return user.twoFactorEnabled;
}

/**
 * Legt eine DB-Session an und setzt das Cookie. In der DB steht nur der
 * SHA-256-Hash des Tokens. `twoFactorVerified: false` bedeutet: Login ist
 * halb fertig - Passwort ok, TOTP-Schritt steht noch aus.
 * Nur aus Server Actions / Route Handlern aufrufen (Cookie-Schreibzugriff).
 */
export async function createSession(userId: string, opts: { twoFactorVerified: boolean }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({
    data: { id: sha256(token), userId, twoFactorVerified: opts.twoFactorVerified, expiresAt },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function markCurrentSessionTwoFactorVerified(sessionId: string) {
  await db.session.update({ where: { id: sessionId }, data: { twoFactorVerified: true } });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { id: sha256(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Meldet den User auf allen Geräten ab (z. B. nach Passwort-Änderung). */
export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export type Auth = { session: Session; user: User };

/**
 * Aktuelle Session inkl. User - pro Request gecacht.
 * Gibt auch halb-verifizierte Sessions zurück (2FA offen); wer eine voll
 * verifizierte Session braucht, nutzt requireUser()/requireSensitive().
 */
export const getCurrentSession = cache(async (): Promise<Auth | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const record = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: true },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await db.session.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }
  const { user, ...session } = record;
  return { session, user };
});

/** Eingeloggt + (falls 2FA aktiv und enforced) TOTP bestanden - sonst Redirect. */
export async function requireUser(): Promise<Auth> {
  const auth = await getCurrentSession();
  if (!auth) redirect("/login");
  if (!isSessionTwoFactorOk(auth)) redirect("/login/2fa");
  return auth;
}

export async function requireRole(...roles: Role[]): Promise<Auth> {
  const auth = await requireUser();
  if (!roles.includes(auth.user.role as Role)) redirect("/plattform");
  return auth;
}

/**
 * Harte serverseitige Zugriffsbedingung für sensible Funktionen
 * (Kund:innenliste, Rechnungen ausstellen, Bewerbungen einsehen):
 * Berater:innen/Admins MÜSSEN 2FA aktiviert haben (unless DISABLE_2FA_REQUIREMENT).
 * Ohne 2FA → Redirect zur Einrichtung. Session-TOTP deckt requireUser() ab.
 */
export async function requireSensitive(...roles: Role[]): Promise<Auth> {
  const auth = await requireRole(...roles);
  if (!hasRequiredTwoFactor(auth.user)) redirect("/plattform/sicherheit?grund=pflicht");
  return auth;
}

/**
 * Variante für Server Actions und Route Handler: wirft statt zu redirecten,
 * damit ein manipulierter Request eine klare Fehlermeldung bekommt.
 */
export async function assertSensitive(...roles: Role[]): Promise<Auth> {
  const auth = await getCurrentSession();
  if (!auth) throw new Error("Nicht angemeldet.");
  if (!isSessionTwoFactorOk(auth)) {
    throw new Error("Zwei-Faktor-Bestätigung für diese Session steht aus.");
  }
  if (!roles.includes(auth.user.role as Role)) throw new Error("Keine Berechtigung.");
  if (!hasRequiredTwoFactor(auth.user)) {
    throw new Error("Diese Funktion erfordert aktivierte Zwei-Faktor-Authentifizierung.");
  }
  return auth;
}

export { ROLES };
