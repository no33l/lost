"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { destroyCurrentSession, getCurrentSession, isSessionTwoFactorOk } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { displayNameSchema } from "@/lib/validation";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { errorState, fromZodError, successState, type ActionState } from "@/lib/action-state";

const displayNameFormSchema = z.object({ displayName: displayNameSchema });

/** Holt die voll verifizierte Session oder liefert eine ActionState-Fehlermeldung. */
async function requireVerifiedAuth() {
  const auth = await getCurrentSession();
  if (!auth) {
    return { auth: null, error: errorState("Du bist nicht angemeldet. Bitte melde dich neu an.") };
  }
  if (!isSessionTwoFactorOk(auth)) {
    return {
      auth: null,
      error: errorState("Deine Zwei-Faktor-Bestätigung für diese Session steht noch aus."),
    };
  }
  return { auth, error: null };
}

export async function updateDisplayName(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { auth, error } = await requireVerifiedAuth();
  if (!auth) return error;

  const parsed = displayNameFormSchema.safeParse({ displayName: formData.get("displayName") });
  if (!parsed.success) return fromZodError(parsed.error);

  await db.user.update({
    where: { id: auth.user.id },
    data: { displayName: parsed.data.displayName },
  });

  // Name taucht in Sidebar, Dashboard-Begrüßung und Chats auf - großzügig revalidieren.
  revalidatePath("/plattform", "layout");
  return successState("Gespeichert - ab jetzt bist du hier als „" + parsed.data.displayName + "“ unterwegs.");
}

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { auth, error } = await requireVerifiedAuth();
  if (!auth) return error;

  // Berater:innen- und Admin-Konten hängen an Verträgen bzw. Verantwortung -
  // die werden nicht per Selbstbedienung gelöscht.
  if (auth.user.role !== ROLES.CLIENT) {
    return errorState(
      "Berater:innen- und Admin-Konten können hier nicht gelöscht werden. Melde dich bei hello@lost-plattform.at."
    );
  }

  const limited = await checkAuthRateLimit("delete-account", 5);
  if (limited) return errorState(limited);

  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return errorState("Bitte bestätige die Löschung mit deinem Passwort.", {
      password: ["Passwort fehlt."],
    });
  }
  if (!bcrypt.compareSync(password, auth.user.passwordHash)) {
    return errorState("Das Passwort stimmt nicht.", {
      password: ["Das Passwort stimmt nicht."],
    });
  }

  try {
    // Sessions, Chats, Nachrichten und Dateien hängen mit onDelete: Cascade am Konto.
    await db.user.delete({ where: { id: auth.user.id } });
  } catch {
    // FK-Restrict: an das Konto adressierte Rechnungen dürfen nicht mitgelöscht werden.
    return errorState(
      "Dein Konto hängt an ausgestellten Rechnungen (Aufbewahrungspflicht). Melde dich bei hello@lost-plattform.at."
    );
  }

  await destroyCurrentSession();
  redirect("/");
}
