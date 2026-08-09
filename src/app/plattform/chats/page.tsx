import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, requireSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Chats - Lost." };

export default async function ChatsPage() {
  const { user } = await requireUser();
  // Chats offenbaren Kund:innen-Beziehungen - für Berater:innen/Admins gilt
  // deshalb die harte 2FA-Bedingung. Klient:innen chatten frei.
  if (user.role === ROLES.ADVISOR || user.role === ROLES.ADMIN) {
    await requireSensitive(ROLES.ADVISOR, ROLES.ADMIN);
  }

  const conversations = await db.conversation.findMany({
    where: { OR: [{ clientId: user.id }, { advisorId: user.id }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      client: true,
      advisor: { include: { advisorProfile: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: { messages: { where: { senderId: { not: user.id }, readAt: null } } },
      },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Chats</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Deine Gespräche sind privat - nur die zwei Beteiligten können sie lesen.
        </p>
      </div>

      {conversations.length === 0 ? (
        user.role === ROLES.CLIENT ? (
          <EmptyState
            icon={<MessageCircle aria-hidden />}
            title="Noch keine Gespräche"
            description="Kein Druck. Wenn du so weit bist, schau dich bei unseren Berater:innen um - echte Menschen, echte Gesichter."
            action={
              <ButtonLink href="/plattform/berater" variant="primary" size="sm">
                Finde ein Gesicht, dem du schreiben magst
              </ButtonLink>
            }
          />
        ) : (
          <EmptyState
            icon={<MessageCircle aria-hidden />}
            title="Noch keine Gespräche"
            description="Sobald dir jemand schreibt, findest du das Gespräch hier."
          />
        )
      ) : (
        <ul className="flex flex-col gap-3">
          {conversations.map((conversation) => {
            const iAmClient = conversation.clientId === user.id;
            const other = iAmClient ? conversation.advisor : conversation.client;
            const profile = conversation.advisor.advisorProfile;

            // Aus Klient:innen-Sicht in Beratungs-Chats: Foto + Vorname der Berater:in.
            const name =
              conversation.kind === "ADVISORY" && iAmClient && profile
                ? profile.firstName
                : other.displayName;
            const photo =
              conversation.kind === "ADVISORY" && iAmClient ? profile?.photoUrl : null;

            const last = conversation.messages[0];
            const preview = last
              ? `${last.senderId === user.id ? "Du: " : ""}${last.body}`
              : "Noch keine Nachrichten - sag hallo.";
            const unread = conversation._count.messages;

            return (
              <li key={conversation.id}>
                <Link
                  href={`/plattform/chats/${conversation.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-[0_1px_3px_rgba(38,34,28,0.05)] transition-all hover:border-coral/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:p-5"
                >
                  <Avatar name={name} src={photo} size="lg" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{name}</span>
                      {conversation.kind === "APPLICATION" && (
                        <Badge tone="lilac">Bewerbung</Badge>
                      )}
                      {unread > 0 && (
                        <Badge
                          tone="coral"
                          aria-label={`${unread} ungelesene Nachricht${unread === 1 ? "" : "en"}`}
                        >
                          {unread} neu
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">{preview}</p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-ink-faint sm:block">
                    {formatDateTime(conversation.lastMessageAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
