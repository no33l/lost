import { randomBytes } from "node:crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { decryptString, encryptString, sha256 } from "./crypto";

// Toleranz von ±1 Zeitfenster (30 s) gegen Uhren-Drift.
authenticator.options = { window: 1 };

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(accountEmail: string, secret: string): string {
  return authenticator.keyuri(accountEmail, "Lost.", secret);
}

export async function totpQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
}

export function verifyTotp(token: string, secret: string): boolean {
  const cleaned = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  return authenticator.verify({ token: cleaned, secret });
}

// Das Secret liegt nie im Klartext in der DB.
export const encryptTotpSecret = encryptString;
export const decryptTotpSecret = decryptString;

const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // ohne i/l/o/0/1

/** Einmal-Codes im Format xxxx-xxxx. Gespeichert wird nur der SHA-256-Hash. */
export function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const chars = Array.from(randomBytes(8), (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]);
    return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
  });
}

export function hashRecoveryCode(code: string): string {
  return sha256(code.trim().toLowerCase());
}
