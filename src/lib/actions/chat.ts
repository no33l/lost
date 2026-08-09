"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getCurrentSession,
  hasRequiredTwoFactor,
  isSessionTwoFactorOk,
  type Auth,
} from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { publishMessage } from "@/lib/chat-bus";
import { errorState, successState, type ActionState } from "@/lib/action-state";

// Server Actions rund um Chats. Alle Checks laufen hart serverseitig:
//  - Teilnahme an der Conversation (clientId oder advisorId)
//  - 2FA-Pflicht für Berater:innen/Admins (Chats offenbaren Kund:innen)
//  - Geschäftsregel: Die erste Klient:innen-Nachricht setzt clientHasMessaged
//    und begründet damit die Kund:innen-Beziehung (Kund:innenliste, Rechnungen).

/** Eingeloggt + TOTP-Schritt der Session bestanden - sonst Fehler (kein Redirect). */
async function requireVerifiedAuth(): Promise<Auth> {
  const auth = await getCurrentSession();
  if (!auth) throw new Error("Nicht angemeldet.");
  if (!isSessionTwoFactorOk(auth)) {
    throw new Error("Zwei-Faktor-Bestätigung für diese Session steht aus.");
  }
  return auth;
}

/** Berater:innen/Admins dürfen Chat-Funktionen nur mit aktivierter 2FA nutzen. */
function assertAdvisorTwoFactor(auth: Auth): void {
  const role = auth.user.role;
  if ((role === ROLES.ADVISOR || role === ROLES.ADMIN) && !hasRequiredTwoFactor(auth.user)) {
    throw new Error("Diese Funktion erfordert aktivierte Zwei-Faktor-Authentifizierung.");
  }
}

/**
 * Startet (oder öffnet) ein Beratungsgespräch mit einer Berater:in.
 * Wird von der Berater-Detailseite via `startConversation.bind(null, userId)`
 * als Form-Action verwendet und leitet direkt in den Chat weiter.
 */
export async function startConversation(advisorUserId: string): Promise<void> {
  const auth = await requireVerifiedAuth();
  if (auth.user.role !== ROLES.CLIENT) {
    throw new Error("Nur Klient:innen können ein Beratungsgespräch starten.");
  }

  const advisor = await db.user.findFirst({
    where: {
      id: advisorUserId,
      role: ROLES.ADVISOR,
      advisorProfile: { is: { published: true } },
    },
    select: { id: true },
  });
  if (!advisor) throw new Error("Diese Berater:in ist gerade nicht verfügbar.");

  const conversation = await db.conversation.upsert({
    where: { clientId_advisorId: { clientId: auth.user.id, advisorId: advisor.id } },
    create: { kind: "ADVISORY", clientId: auth.user.id, advisorId: advisor.id },
    update: {},
  });

  redirect(`/plattform/chats/${conversation.id}`);
}

/** Form-Action zum Senden einer Nachricht (Felder: conversationId, body). */
export async function sendMessage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let auth: Auth;
  try {
    auth = await requireVerifiedAuth();
    assertAdvisorTwoFactor(auth);
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Kein Zugriff.");
  }

  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!conversationId) return errorState("Gespräch nicht gefunden.");
  if (body.length === 0) {
    return errorState("Schreib erst eine Nachricht - auch ein Satz reicht.");
  }
  if (body.length > 4000) {
    return errorState("Deine Nachricht ist zu lang (max. 4000 Zeichen). Teil sie einfach auf.");
  }

  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  if (
    !conversation ||
    (conversation.clientId !== auth.user.id && conversation.advisorId !== auth.user.id)
  ) {
    return errorState("Du bist an diesem Gespräch nicht beteiligt.");
  }

  const limited = rateLimit(`msg:${auth.user.id}`, 30, 60_000);
  if (!limited.ok) {
    return errorState("Kurz durchatmen - das waren gerade sehr viele Nachrichten. Versuch es gleich nochmal.");
  }

  const message = await db.message.create({
    data: { conversationId: conversation.id, senderId: auth.user.id, body },
  });

  const firstClientMessage =
    conversation.clientId === auth.user.id && !conversation.clientHasMessaged;

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: message.createdAt,
      // Geschäftsregel 1: Erst die erste Klient:innen-Nachricht begründet
      // die Kund:innen-Beziehung (Kund:innenliste + Rechnungen).
      ...(firstClientMessage ? { clientHasMessaged: true } : {}),
    },
  });

  publishMessage({
    id: message.id,
    conversationId: conversation.id,
    senderId: auth.user.id,
    senderName: auth.user.displayName,
    body,
    createdAt: message.createdAt.toISOString(),
  });

  revalidatePath("/plattform/chats");
  revalidatePath(`/plattform/chats/${conversation.id}`);
  if (firstClientMessage) revalidatePath("/plattform/kunden");

  return successState();
}

/** Markiert alle fremden Nachrichten der Conversation als gelesen. */
export async function markConversationRead(conversationId: string): Promise<void> {
  const auth = await requireVerifiedAuth();
  assertAdvisorTwoFactor(auth);

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { clientId: true, advisorId: true },
  });
  if (
    !conversation ||
    (conversation.clientId !== auth.user.id && conversation.advisorId !== auth.user.id)
  ) {
    throw new Error("Du bist an diesem Gespräch nicht beteiligt.");
  }

  await db.message.updateMany({
    where: { conversationId, senderId: { not: auth.user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/plattform/chats");
}
