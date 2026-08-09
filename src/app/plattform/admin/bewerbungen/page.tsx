import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileText, Inbox } from "lucide-react";
import { db } from "@/lib/db";
import { requireSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Bewerbungen" };

function StatusBadges({ status, contactedAt }: { status: string; contactedAt: Date | null }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {status === "PENDING" && <Badge tone="amber">Offen</Badge>}
      {status === "PENDING" && contactedAt && <Badge tone="lilac">Im Gespräch</Badge>}
      {status === "ACCEPTED" && <Badge tone="pine">Angenommen</Badge>}
      {status === "REJECTED" && <Badge tone="neutral">Abgelehnt</Badge>}
    </span>
  );
}

export default async function AdminBewerbungenPage() {
  await requireSensitive(ROLES.ADMIN);

  const applications = await db.application.findMany({
    include: { user: true, documents: true },
    orderBy: { createdAt: "desc" },
  });

  // Offene zuerst - innerhalb der Gruppen bleibt „neueste zuerst" erhalten.
  const sorted = [...applications].sort(
    (a, b) => Number(a.status !== "PENDING") - Number(b.status !== "PENDING")
  );
  const openCount = applications.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Bewerbungen</h1>
        <p className="max-w-2xl leading-relaxed text-ink-soft">
          {openCount === 0
            ? "Gerade liegt nichts Offenes auf dem Tisch."
            : openCount === 1
              ? "Eine offene Bewerbung wartet auf einen Blick."
              : `${openCount} offene Bewerbungen warten auf einen Blick.`}{" "}
          Jede davon ist ein Mensch - nimm dir die Zeit.
        </p>
      </header>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Inbox aria-hidden />}
          title="Noch keine Bewerbungen"
          description="Sobald sich jemand als Lebensberater:in bewirbt, taucht die Bewerbung hier auf."
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((application) => (
            <li key={application.id}>
              <Link
                href={`/plattform/admin/bewerbungen/${application.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-card p-5 shadow-[0_1px_3px_rgba(38,34,28,0.05)] transition-all hover:border-ink/25 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <p className="font-display text-lg font-semibold text-ink">
                      {application.firstName} {application.lastName}
                    </p>
                    <StatusBadges status={application.status} contactedAt={application.contactedAt} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                    <span>{application.age} Jahre</span>
                    <span aria-hidden className="text-ink-faint">·</span>
                    <span>eingereicht am {formatDate(application.createdAt)}</span>
                    <span aria-hidden className="text-ink-faint">·</span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="size-3.5" aria-hidden />
                      {application.documents.length}{" "}
                      {application.documents.length === 1 ? "Dokument" : "Dokumente"}
                    </span>
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
