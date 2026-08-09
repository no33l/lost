import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { StoredFile } from "@prisma/client";
import { db } from "./db";
import { decryptBuffer, encryptBuffer } from "./crypto";

// Uploads liegen AES-256-GCM-verschlüsselt unter storage/ (gitignored) und
// werden ausschließlich über /api/files/[id] mit Berechtigungsprüfung ausgeliefert.

const STORAGE_DIR = path.join(process.cwd(), "storage");

export const FILE_KINDS = {
  APPLICATION_DOC: "APPLICATION_DOC",
  ADVISOR_LOGO: "ADVISOR_LOGO",
  PROFILE_PHOTO: "PROFILE_PHOTO",
} as const;

export type FileKind = (typeof FILE_KINDS)[keyof typeof FILE_KINDS];

const LIMITS: Record<FileKind, { maxBytes: number; mimeTypes: string[]; label: string }> = {
  APPLICATION_DOC: {
    maxBytes: 8 * 1024 * 1024,
    mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    label: "PDF, JPG, PNG oder WebP bis 8 MB",
  },
  // pdfkit kann nur PNG/JPEG in Rechnungen einbetten.
  ADVISOR_LOGO: {
    maxBytes: 2 * 1024 * 1024,
    mimeTypes: ["image/png", "image/jpeg"],
    label: "PNG oder JPG bis 2 MB",
  },
  PROFILE_PHOTO: {
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "JPG, PNG oder WebP bis 5 MB",
  },
};

export function uploadHint(kind: FileKind): string {
  return LIMITS[kind].label;
}

/** Validiert, verschlüsselt und speichert einen Upload; legt den DB-Eintrag an. */
export async function saveUploadedFile(
  file: File,
  opts: { ownerId: string; kind: FileKind }
): Promise<StoredFile> {
  const limit = LIMITS[opts.kind];
  if (!file || file.size === 0) throw new Error("Die Datei ist leer.");
  if (file.size > limit.maxBytes) {
    throw new Error(`Die Datei ist zu groß (erlaubt: ${limit.label}).`);
  }
  if (!limit.mimeTypes.includes(file.type)) {
    throw new Error(`Dieser Dateityp ist nicht erlaubt (erlaubt: ${limit.label}).`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const storedName = `${randomBytes(16).toString("hex")}.bin`;
  await mkdir(STORAGE_DIR, { recursive: true });
  await writeFile(path.join(STORAGE_DIR, storedName), encryptBuffer(buffer));
  return db.storedFile.create({
    data: {
      ownerId: opts.ownerId,
      kind: opts.kind,
      fileName: file.name || "datei",
      mimeType: file.type,
      size: file.size,
      storedName,
    },
  });
}

export async function readStoredFile(
  id: string
): Promise<{ record: StoredFile; data: Buffer } | null> {
  const record = await db.storedFile.findUnique({ where: { id } });
  if (!record) return null;
  const blob = await readFile(path.join(STORAGE_DIR, record.storedName));
  return { record, data: decryptBuffer(blob) };
}

export async function deleteStoredFile(id: string): Promise<void> {
  const record = await db.storedFile.findUnique({ where: { id } });
  if (!record) return;
  await unlink(path.join(STORAGE_DIR, record.storedName)).catch(() => {});
  await db.storedFile.delete({ where: { id } }).catch(() => {});
}
