"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentSession, isSessionTwoFactorOk } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import {
  errorState,
  fromZodError,
  successState,
  type ActionState,
} from "@/lib/action-state";
import { deleteStoredFile, FILE_KINDS, saveUploadedFile } from "@/lib/storage";

// Bewerbung „Als Lebensberater:in bewerben" - einmalig pro Account.

const MAX_OPTIONAL_DOCS = 5;

const applicationSchema = z.object({
  firstName: z
    .string({ required_error: "Vorname fehlt." })
    .trim()
    .min(2, "Mindestens 2 Zeichen.")
    .max(60, "Maximal 60 Zeichen."),
  lastName: z
    .string({ required_error: "Nachname fehlt." })
    .trim()
    .min(2, "Mindestens 2 Zeichen.")
    .max(60, "Maximal 60 Zeichen."),
  age: z.coerce
    .number({ invalid_type_error: "Bitte gib dein Alter als Zahl an." })
    .int("Bitte gib dein Alter als ganze Zahl an.")
    .min(18, "Du musst mindestens 18 Jahre alt sein.")
    .max(99, "Bitte gib ein realistisches Alter an."),
  birthPlace: z
    .string({ required_error: "Geburtsort fehlt." })
    .trim()
    .min(2, "Mindestens 2 Zeichen.")
    .max(120, "Maximal 120 Zeichen."),
  languages: z
    .string({ required_error: "Sprachen fehlen." })
    .trim()
    .min(2, "Gib mindestens eine Sprache an.")
    .max(200, "Maximal 200 Zeichen."),
  text: z
    .string({ required_error: "Bewerbungstext fehlt." })
    .trim()
    .min(150, "Mindestens 150 Zeichen - erzähl uns ein bisschen mehr von dir.")
    .max(5000, "Maximal 5000 Zeichen."),
});

/** Liefert die Datei nur, wenn wirklich eine ausgewählt wurde (leere Inputs kommen als File mit size 0 an). */
function pickFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function submitApplication(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await getCurrentSession();
  if (!auth) return errorState("Bitte melde dich an.");
  if (!isSessionTwoFactorOk(auth)) {
    return errorState("Zwei-Faktor-Bestätigung für diese Session steht noch aus.");
  }
  if (auth.user.role !== ROLES.CLIENT) {
    return errorState("Du bist schon an Bord - eine Bewerbung ist nicht mehr nötig.");
  }

  const existing = await db.application.findUnique({ where: { userId: auth.user.id } });
  if (existing) {
    return errorState("Du hast bereits eine Bewerbung eingereicht.");
  }

  const parsed = applicationSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    age: formData.get("age"),
    birthPlace: formData.get("birthPlace"),
    languages: formData.get("languages"),
    text: formData.get("text"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const ausweis = pickFile(formData.get("ausweis"));
  const gewerbeschein = pickFile(formData.get("gewerbeschein"));
  const optionale = formData
    .getAll("optionale")
    .map(pickFile)
    .filter((file): file is File => file !== null);

  if (!ausweis || !gewerbeschein || optionale.length > MAX_OPTIONAL_DOCS) {
    const fieldErrors: Record<string, string[]> = {};
    if (!ausweis) fieldErrors.ausweis = ["Bitte lade deinen Ausweis hoch."];
    if (!gewerbeschein) {
      fieldErrors.gewerbeschein = ["Bitte lade deinen Gewerbeschein bzw. deine Berechtigung hoch."];
    }
    if (optionale.length > MAX_OPTIONAL_DOCS) {
      fieldErrors.optionale = [`Maximal ${MAX_OPTIONAL_DOCS} weitere Dokumente.`];
    }
    return errorState("Bitte prüfe deine Eingaben.", fieldErrors);
  }

  const uploads: { file: File; kind: "AUSWEIS" | "GEWERBESCHEIN" | "OPTIONAL" }[] = [
    { file: ausweis, kind: "AUSWEIS" },
    { file: gewerbeschein, kind: "GEWERBESCHEIN" },
    ...optionale.map((file) => ({ file, kind: "OPTIONAL" as const })),
  ];

  // Erst alle Dateien sichern, dann die Bewerbung anlegen. Geht unterwegs etwas
  // schief, werden bereits gespeicherte Dateien wieder aufgeräumt.
  const savedFileIds: string[] = [];
  const documents: { kind: string; fileId: string }[] = [];
  try {
    for (const upload of uploads) {
      const stored = await saveUploadedFile(upload.file, {
        ownerId: auth.user.id,
        kind: FILE_KINDS.APPLICATION_DOC,
      });
      savedFileIds.push(stored.id);
      documents.push({ kind: upload.kind, fileId: stored.id });
    }

    await db.application.create({
      data: {
        userId: auth.user.id,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        age: parsed.data.age,
        birthPlace: parsed.data.birthPlace,
        languages: parsed.data.languages,
        text: parsed.data.text,
        documents: { create: documents },
      },
    });
  } catch (error) {
    await Promise.all(savedFileIds.map((id) => deleteStoredFile(id)));
    const message =
      error instanceof Error ? error.message : "Da ist etwas schiefgelaufen. Versuch es nochmal.";
    return errorState(message);
  }

  revalidatePath("/plattform/bewerbung");
  revalidatePath("/plattform/admin/bewerbungen");
  return successState("Deine Bewerbung ist eingegangen.");
}
