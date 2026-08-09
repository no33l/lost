import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession, hasRequiredTwoFactor, isSessionTwoFactorOk } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { subscribeToConversation } from "@/lib/chat-bus";

// Server-Sent Events für einen Chat: hält die Verbindung offen und schiebt
// neue Nachrichten der Conversation als `data:`-Events an den Browser.
// Zugriff exakt wie im Chat selbst: Teilnehmer:in sein, Session voll verifiziert,
// Berater:innen/Admins zusätzlich nur mit aktivierter 2FA.

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const auth = await getCurrentSession();
  if (!auth) return new Response("Nicht angemeldet.", { status: 401 });
  if (!isSessionTwoFactorOk(auth)) {
    return new Response("Zwei-Faktor-Bestätigung ausstehend.", { status: 401 });
  }

  const conversation = await db.conversation.findUnique({
    where: { id },
    select: { clientId: true, advisorId: true },
  });
  if (!conversation) return new Response("Gespräch nicht gefunden.", { status: 404 });
  if (conversation.clientId !== auth.user.id && conversation.advisorId !== auth.user.id) {
    return new Response("Kein Zugriff auf dieses Gespräch.", { status: 403 });
  }
  if (
    (auth.user.role === ROLES.ADVISOR || auth.user.role === ROLES.ADMIN) &&
    !hasRequiredTwoFactor(auth.user)
  ) {
    return new Response(
      "Diese Funktion erfordert aktivierte Zwei-Faktor-Authentifizierung.",
      { status: 403 }
    );
  }

  const encoder = new TextEncoder();
  let dispose: () => void = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      send(": connected\n\n");
      const unsubscribe = subscribeToConversation(id, (event) => {
        send(`data: ${JSON.stringify(event)}\n\n`);
      });
      const heartbeat = setInterval(() => send(": ping\n\n"), 25_000);

      let disposed = false;
      dispose = () => {
        if (disposed) return;
        disposed = true;
        closed = true;
        unsubscribe();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Stream war bereits geschlossen - nichts zu tun.
        }
      };
      request.signal.addEventListener("abort", dispose);
    },
    cancel() {
      dispose();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
