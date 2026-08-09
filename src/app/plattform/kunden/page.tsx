import { MessageCircle, Receipt, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Kund:innen - Lost." };

export default async function KundenPage() {
  // Harte Bedingung: nur Berater:innen mit aktivierter 2FA sehen ihre Kund:innen.
  const { user } = await requireSensitive(ROLES.ADVISOR);

  const conversations = await db.conversation.findMany({
    where: { advisorId: user.id, kind: "ADVISORY", clientHasMessaged: true },
    include: { client: true },
    orderBy: { lastMessageAt: "desc" },
  });

  const invoiceGroups =
    conversations.length > 0
      ? await db.invoice.groupBy({
          by: ["clientId"],
          where: {
            advisorId: user.id,
            clientId: { in: conversations.map((c) => c.clientId) },
          },
          _count: { _all: true },
        })
      : [];
  const invoiceCountByClient = new Map(
    invoiceGroups.map((group) => [group.clientId, group._count._all])
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Kund:innen</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Die Menschen, die dir geschrieben haben - und denen du Rechnungen stellen darfst.
        </p>
      </div>

      <Alert tone="info" className="mb-6">
        Sobald dir jemand zum ersten Mal schreibt, erscheint die Person hier - und erst dann
        kannst du ihr Rechnungen stellen.
      </Alert>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<Users aria-hidden />}
          title="Noch keine Kund:innen"
          description="Sobald dir eine Klient:in zum ersten Mal schreibt, taucht sie hier auf. Bis dahin: Dein Profil spricht für dich."
        />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-line">
              {conversations.map((conversation) => {
                const invoiceCount = invoiceCountByClient.get(conversation.clientId) ?? 0;
                return (
                  <li
                    key={conversation.id}
                    className="flex flex-col gap-3 p-4 sm:px-5 md:flex-row md:items-center md:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={conversation.client.displayName} size="md" className="shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {conversation.client.displayName}
                        </p>
                        <p className="text-xs text-ink-faint">
                          Kund:in seit {formatDate(conversation.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="grid shrink-0 gap-0.5 text-xs text-ink-soft md:text-right">
                      <span>Letzte Nachricht: {formatDateTime(conversation.lastMessageAt)}</span>
                      <span>
                        {invoiceCount === 1
                          ? "1 Rechnung von dir"
                          : `${invoiceCount} Rechnungen von dir`}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <ButtonLink
                        href={`/plattform/chats/${conversation.id}`}
                        variant="ghost"
                        size="sm"
                      >
                        <MessageCircle className="size-4" aria-hidden />
                        Chat
                      </ButtonLink>
                      <ButtonLink
                        href={`/plattform/rechnungen/neu?kunde=${conversation.clientId}`}
                        variant="primary"
                        size="sm"
                      >
                        <Receipt className="size-4" aria-hidden />
                        Rechnung stellen
                      </ButtonLink>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <p className="mt-3 text-xs text-ink-faint">
            Anzeigenamen können Pseudonyme sein - Klient:innen dürfen bei uns anonym bleiben.
          </p>
        </>
      )}
    </div>
  );
}
