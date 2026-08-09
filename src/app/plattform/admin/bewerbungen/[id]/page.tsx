import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { requireSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DecisionButtons } from "./DecisionButtons";

export const metadata: Metadata = { title: "Bewerbung" };

const KIND_LABELS: Record<string, string> = {
  AUSWEIS: "Ausweis",
  GEWERBESCHEIN: "Gewerbeschein / Berechtigung",
  OPTIONAL: "Weiteres Dokument",
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function AdminBewerbungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSensitive(ROLES.ADMIN);
  const { id } = await params;

  const application = await db.application.findUnique({
    where: { id },
    include: {
      user: true,
      decidedBy: true,
      documents: { include: { file: true } },
    },
  });
  if (!application) notFound();

  const details: [string, string][] = [
    ["Name", `${application.firstName} ${application.lastName}`],
    ["Alter", `${application.age} Jahre`],
    ["Geburtsort", application.birthPlace],
    ["Sprachen", application.languages],
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/plattform/admin/bewerbungen"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Alle Bewerbungen
        </Link>
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            {application.firstName} {application.lastName}
          </h1>
          {application.status === "PENDING" && <Badge tone="amber">Offen</Badge>}
          {application.status === "PENDING" && application.contactedAt && (
            <Badge tone="lilac">Im Gespräch</Badge>
          )}
          {application.status === "ACCEPTED" && <Badge tone="pine">Angenommen</Badge>}
          {application.status === "REJECTED" && <Badge tone="neutral">Abgelehnt</Badge>}
        </div>
        <p className="text-sm text-ink-faint">
          Eingereicht am {formatDate(application.createdAt)}
          {application.contactedAt && ` · Kontakt aufgenommen am ${formatDate(application.contactedAt)}`}
        </p>
      </header>

      {application.status === "PENDING" ? (
        <DecisionButtons applicationId={application.id} />
      ) : (
        <Alert tone={application.status === "ACCEPTED" ? "success" : "info"}>
          {application.status === "ACCEPTED" ? "Angenommen" : "Abgelehnt"}
          {application.decidedAt && ` am ${formatDateTime(application.decidedAt)}`}
          {application.decidedBy && ` von ${application.decidedBy.displayName}`}.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">Angaben</h2>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">Account</h2>
          <div className="flex items-center gap-3">
            <Avatar name={application.user.displayName} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {application.user.displayName}
              </p>
              <p className="truncate text-sm text-ink-soft">{application.user.email}</p>
            </div>
          </div>
          <dl>
            <dt className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Mitglied seit
            </dt>
            <dd className="mt-0.5 text-sm text-ink">{formatDate(application.user.createdAt)}</dd>
          </dl>
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-ink">Bewerbungstext</h2>
        <p className="leading-relaxed whitespace-pre-line text-ink-soft">{application.text}</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-ink">Dokumente</h2>
        <ul className="divide-y divide-line">
          {application.documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper-soft text-ink-faint">
                <FileText className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {KIND_LABELS[doc.kind] ?? "Dokument"}
                </p>
                <p className="truncate text-xs text-ink-faint">
                  {doc.file.fileName} · {formatSize(doc.file.size)}
                </p>
              </div>
              <a
                href={`/api/files/${doc.fileId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/25 px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink/50 hover:bg-ink/5"
              >
                Ansehen
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-ink-faint">
          Dokumente sind verschlüsselt gespeichert und nur für Administrator:innen mit aktiver
          Zwei-Faktor-Authentifizierung abrufbar.
        </p>
      </Card>
    </div>
  );
}
