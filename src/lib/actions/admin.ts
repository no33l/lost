"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";

// Admin-Entscheidungen über Bewerbungen. Alle Aktionen erzwingen serverseitig
// Admin-Rolle + aktivierte und in dieser Session bestätigte 2FA.

const LIST_PATH = "/plattform/admin/bewerbungen";

function revalidateApplication(applicationId: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${applicationId}`);
}

/**
 * Bewerbung annehmen: Status setzen, Account zur Berater:in machen und ein
 * (noch unveröffentlichtes) Berater-Profil aus den Bewerbungsdaten anlegen.
 */
export async function acceptApplication(applicationId: string): Promise<void> {
  const { user: admin } = await assertSensitive(ROLES.ADMIN);

  const application = await db.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new Error("Bewerbung nicht gefunden.");

  if (application.status === "PENDING") {
    await db.$transaction([
      db.application.update({
        where: { id: application.id },
        data: { status: "ACCEPTED", decidedAt: new Date(), decidedById: admin.id },
      }),
      db.user.update({
        where: { id: application.userId },
        data: { role: ROLES.ADVISOR },
      }),
      db.advisorProfile.upsert({
        where: { userId: application.userId },
        create: {
          userId: application.userId,
          firstName: application.firstName,
          lastName: application.lastName,
          age: application.age,
          languages: application.languages,
          bio: "",
          published: false,
        },
        update: {},
      }),
    ]);
  }

  revalidateApplication(applicationId);
  revalidatePath("/plattform/admin/nutzer");
  redirect(`${LIST_PATH}/${applicationId}`);
}

export async function rejectApplication(applicationId: string): Promise<void> {
  const { user: admin } = await assertSensitive(ROLES.ADMIN);

  const application = await db.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new Error("Bewerbung nicht gefunden.");

  if (application.status === "PENDING") {
    await db.application.update({
      where: { id: application.id },
      data: { status: "REJECTED", decidedAt: new Date(), decidedById: admin.id },
    });
  }

  revalidateApplication(applicationId);
  redirect(`${LIST_PATH}/${applicationId}`);
}

/**
 * Kontakt zur Bewerber:in aufnehmen: legt (falls nötig) eine
 * APPLICATION-Conversation zwischen Bewerber:in und diesem Admin an und
 * springt direkt in den Chat.
 */
export async function contactApplicant(applicationId: string): Promise<void> {
  const { user: admin } = await assertSensitive(ROLES.ADMIN);

  const application = await db.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new Error("Bewerbung nicht gefunden.");

  const conversation = await db.conversation.upsert({
    where: {
      clientId_advisorId: { clientId: application.userId, advisorId: admin.id },
    },
    create: {
      kind: "APPLICATION",
      clientId: application.userId,
      advisorId: admin.id,
    },
    update: {},
  });

  if (!application.contactedAt) {
    await db.application.update({
      where: { id: application.id },
      data: { contactedAt: new Date() },
    });
  }

  revalidateApplication(applicationId);
  revalidatePath("/plattform/chats");
  redirect(`/plattform/chats/${conversation.id}`);
}
