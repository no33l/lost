import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// AES-256-GCM für alles Sensible: hochgeladene Dokumente auf der Platte
// und TOTP-Secrets in der Datenbank. Blob-Format: iv(12) | authTag(16) | ciphertext.

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "ENCRYPTION_KEY fehlt oder ist ungültig (erwartet: 64 Hex-Zeichen). Siehe .env.example."
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptBuffer(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptBuffer(blob: Buffer): Buffer {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ciphertext = blob.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function encryptString(plain: string): string {
  return encryptBuffer(Buffer.from(plain, "utf8")).toString("base64");
}

export function decryptString(encoded: string): string {
  return decryptBuffer(Buffer.from(encoded, "base64")).toString("utf8");
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
