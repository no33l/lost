import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, requireSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ChatWindow, type ChatMessage } from "./ChatWindow";

export const metadata = { title: "Chat - Lost." };

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  // Gleiche harte Bedingung wie in der Chat-Liste: Berater:innen/Admins nur mit 2FA.
  if (user.role === ROLES.ADVISOR || user.role === ROLES.ADMIN) {
    await requireSensitive(ROLES.ADVISOR, ROLES.ADMIN);
  }

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      client: true,
      advisor: { include: { advisorProfile: true } },
      // Die letzten 200 Nachrichten, chronologisch aufsteigend.
      messages: { orderBy: { createdAt: "asc" }, take: -200 },
    },
  });
  if (
    !conversation ||
    (conversation.clientId !== user.id && conversation.advisorId !== user.id)
  ) {
    notFound();
  }

  // Fremde Nachrichten direkt serverseitig als gelesen markieren -
  // wer die Seite öffnet, hat sie gesehen.
  await db.message.updateMany({
    where: { conversationId: conversation.id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const iAmClient = conversation.clientId === user.id;
  const other = iAmClient ? conversation.advisor : conversation.client;
  const profile = conversation.advisor.advisorProfile;

  const showAdvisorProfile = conversation.kind === "ADVISORY" && iAmClient && profile;
  const otherName = showAdvisorProfile
    ? `${profile.firstName} ${profile.lastName}`
    : other.displayName;
  const otherPhoto = showAdvisorProfile ? profile.photoUrl : null;

  const initialMessages: ChatMessage[] = conversation.messages.map((message) => ({
    id: message.id,
    senderId: message.senderId,
    senderName:
      message.senderId === conversation.clientId
        ? conversation.client.displayName
        : conversation.advisor.displayName,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  }));

  return (
    <div className="flex h-[calc(100dvh-10.5rem)] min-h-[26rem] flex-col lg:h-[calc(100dvh-7.5rem)]">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/plattform/chats"
          aria-label="Zurück zu allen Chats"
          className="rounded-full p-2 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <Avatar name={otherName} src={otherPhoto} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {showAdvisorProfile ? (
              <Link
                href={`/plattform/berater/${profile.id}`}
                className="truncate font-display text-lg font-semibold text-ink underline-offset-4 hover:underline"
              >
                {otherName}
              </Link>
            ) : (
              <span className="truncate font-display text-lg font-semibold text-ink">
                {otherName}
              </span>
            )}
            {conversation.kind === "APPLICATION" && <Badge tone="lilac">Bewerbung</Badge>}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            Dieses Gespräch ist privat. Nur ihr zwei könnt es lesen.
          </p>
        </div>
      </header>

      <ChatWindow
        conversationId={conversation.id}
        meId={user.id}
        meName={user.displayName}
        initialMessages={initialMessages}
      />
    </div>
  );
}
