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

// Öffentliches Berater-Profil pflegen. Bewusst ohne 2FA-Zwang erreichbar,
// damit frisch angenommene Berater:innen sofort loslegen können - sensible
// Bereiche (Kund:innen, Rechnungen) sind separat geschützt.

const FILE_URL_PREFIX = "/api/files/";

const profileSchema = z.object({
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
    .min(18, "Mindestens 18.")
    .max(99, "Bitte gib ein realistisches Alter an."),
  languages: z
    .string({ required_error: "Sprachen fehlen." })
    .trim()
    .min(2, "Gib mindestens eine Sprache an.")
    .max(200, "Maximal 200 Zeichen."),
  bio: z
    .string({ required_error: "Beschreibung fehlt." })
    .trim()
    .min(80, "Mindestens 80 Zeichen - ein bisschen was von dir darf schon sein.")
    .max(3000, "Maximal 3000 Zeichen."),
});

export async function saveAdvisorProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await getCurrentSession();
  if (!auth) return errorState("Bitte melde dich an.");
  if (!isSessionTwoFactorOk(auth)) {
    return errorState("Zwei-Faktor-Bestätigung für diese Session steht noch aus.");
  }
  if (auth.user.role !== ROLES.ADVISOR) {
    return errorState("Nur Lebensberater:innen können ein Berater-Profil pflegen.");
  }

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    age: formData.get("age"),
    languages: formData.get("languages"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const published = formData.get("published") === "on";

  const existing = await db.advisorProfile.findUnique({ where: { userId: auth.user.id } });

  // Neues Foto? Erst speichern, dann verlinken.
  let newPhotoUrl: string | undefined;
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    try {
      const stored = await saveUploadedFile(foto, {
        ownerId: auth.user.id,
        kind: FILE_KINDS.PROFILE_PHOTO,
      });
      newPhotoUrl = `${FILE_URL_PREFIX}${stored.id}`;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Das Foto konnte nicht gespeichert werden.";
      return errorState("Bitte prüfe deine Eingaben.", { foto: [message] });
    }
  }

  await db.advisorProfile.upsert({
    where: { userId: auth.user.id },
    create: {
      userId: auth.user.id,
      ...parsed.data,
      photoUrl: newPhotoUrl ?? null,
      published,
    },
    update: {
      ...parsed.data,
      ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
      published,
    },
  });

  // Altes hochgeladenes Foto aufräumen - nur wenn es wirklich uns gehört.
  const oldUrl = existing?.photoUrl;
  if (newPhotoUrl && oldUrl && oldUrl.startsWith(FILE_URL_PREFIX) && oldUrl !== newPhotoUrl) {
    const oldId = oldUrl.slice(FILE_URL_PREFIX.length);
    if (oldId) {
      const oldFile = await db.storedFile.findUnique({ where: { id: oldId } });
      if (oldFile && oldFile.ownerId === auth.user.id) {
        await deleteStoredFile(oldId);
      }
    }
  }

  revalidatePath("/plattform/berater-profil");
  revalidatePath("/plattform/berater");
  return successState("Gespeichert.");
}
