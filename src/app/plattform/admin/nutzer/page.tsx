import type { Metadata } from "next";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireSensitive } from "@/lib/session";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Nutzer:innen" };

const ROLE_TONES: Record<Role, "neutral" | "pine" | "coral"> = {
  CLIENT: "neutral",
  ADVISOR: "pine",
  ADMIN: "coral",
};

function roleBadge(role: string) {
  const tone = ROLE_TONES[role as Role] ?? "neutral";
  const label = ROLE_LABELS[role as Role] ?? role;
  return <Badge tone={tone}>{label}</Badge>;
}

function twoFactorBadge(enabled: boolean) {
  return enabled ? <Badge tone="pine">aktiv</Badge> : <Badge tone="neutral">-</Badge>;
}

export default async function AdminNutzerPage() {
  await requireSensitive(ROLES.ADMIN);

  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Nutzer:innen</h1>
        <p className="max-w-2xl leading-relaxed text-ink-soft">
          {users.length === 1 ? "Ein Account" : `${users.length} Accounts`} auf der Plattform.
          Klient:innen dürfen pseudonym unterwegs sein - der Anzeigename muss kein Klarname sein.
        </p>
      </header>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users aria-hidden />}
          title="Noch keine Nutzer:innen"
          description="Sobald sich jemand registriert, erscheint der Account hier."
        />
      ) : (
        <>
          {/* Mobile: Karten */}
          <ul className="space-y-3 md:hidden">
            {users.map((user) => (
              <li key={user.id}>
                <Card className="space-y-3 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.displayName} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{user.displayName}</p>
                      <p className="truncate text-xs text-ink-faint">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                    {roleBadge(user.role)}
                    <span className="inline-flex items-center gap-1.5">
                      2FA: {twoFactorBadge(user.twoFactorEnabled)}
                    </span>
                    <span>seit {formatDate(user.createdAt)}</span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop: Tabelle */}
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs tracking-wide text-ink-faint uppercase">
                  <th scope="col" className="px-6 py-4 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium">
                    E-Mail
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium">
                    Rolle
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium">
                    2FA
                  </th>
                  <th scope="col" className="px-6 py-4 font-medium">
                    Mitglied seit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-3.5">
                      <span className="flex items-center gap-3">
                        <Avatar name={user.displayName} size="sm" />
                        <span className="font-medium text-ink">{user.displayName}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-ink-soft">{user.email}</td>
                    <td className="px-6 py-3.5">{roleBadge(user.role)}</td>
                    <td className="px-6 py-3.5">{twoFactorBadge(user.twoFactorEnabled)}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-ink-soft">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
