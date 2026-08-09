import type { Metadata } from "next";
import { MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { FILE_KINDS, uploadHint } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ApplicationForm } from "./ApplicationForm";

export const metadata: Metadata = { title: "Als Lebensberater:in bewerben" };

function PageHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="space-y-1.5">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Als Lebensberater:in bewerben
      </h1>
      <p className="max-w-2xl leading-relaxed text-ink-soft">{subtitle}</p>
    </header>
  );
}

function ApplicantDetails({
  application,
}: {
  application: { firstName: string; lastName: string; age: number; birthPlace: string; languages: string };
}) {
  const rows: [string, string][] = [
    ["Name", `${application.firstName} ${application.lastName}`],
    ["Alter", `${application.age}`],
    ["Geburtsort", application.birthPlace],
    ["Sprachen", application.languages],
  ];
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium tracking-wide text-ink-faint uppercase">{label}</dt>
          <dd className="mt-0.5 text-sm text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function BewerbungPage() {
  const { user } = await requireUser();

  // Berater:innen und Admins müssen sich nicht (mehr) bewerben.
  if (user.role !== ROLES.CLIENT) {
    const isAdvisor = user.role === ROLES.ADVISOR;
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <PageHeader subtitle="Schön, dass du da bist - aber diesen Schritt hast du schon hinter dir." />
        <Card className="space-y-4 p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-pine-soft text-pine">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">Du bist schon an Bord</h2>
          </div>
          <p className="leading-relaxed text-ink-soft">
            {isAdvisor
              ? "Du bist bereits Lebensberater:in bei Lost. Eine Bewerbung brauchst du nicht mehr - kümmere dich stattdessen um dein öffentliches Profil, damit Klient:innen dich finden."
              : "Du bist Teil des Teams hinter Lost. - hier gibt es für dich nichts zu bewerben."}
          </p>
          <ButtonLink href={isAdvisor ? "/plattform/berater-profil" : "/plattform"} variant="primary">
            {isAdvisor ? "Zu meinem Berater-Profil" : "Zur Übersicht"}
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const application = await db.application.findUnique({ where: { userId: user.id } });

  // Bereits beworben: Status statt Formular.
  if (application) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <PageHeader subtitle="Deine Bewerbung ist bei uns. Hier siehst du, wo sie gerade steht." />

        {application.status === "PENDING" && (
          <Card className="space-y-5 p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="amber">In Prüfung</Badge>
              {application.contactedAt && <Badge tone="lilac">Wir sind im Gespräch</Badge>}
            </div>
            <p className="text-sm text-ink-faint">
              Eingereicht am {formatDate(application.createdAt)}
            </p>
            <ApplicantDetails application={application} />
            <div className="rounded-xl bg-paper-soft p-4 text-sm leading-relaxed text-ink-soft">
              Die Gründerinnen schauen sich jede Bewerbung persönlich an. Wenn ein Admin Kontakt
              aufnimmt, findest du das Gespräch unter{" "}
              <Link
                href="/plattform/chats"
                className="font-medium text-coral underline-offset-2 hover:underline"
              >
                Chats
              </Link>
              .
            </div>
            {application.contactedAt && (
              <ButtonLink href="/plattform/chats" variant="secondary" size="sm">
                <MessageCircle className="size-4" aria-hidden />
                Zum Gespräch
              </ButtonLink>
            )}
          </Card>
        )}

        {application.status === "REJECTED" && (
          <Card className="space-y-5 p-8">
            <Badge tone="neutral">Diesmal nicht</Badge>
            <p className="text-sm text-ink-faint">
              Eingereicht am {formatDate(application.createdAt)}
            </p>
            <p className="leading-relaxed text-ink-soft">
              Wir haben uns diesmal gegen deine Bewerbung entschieden. Das sagt nichts darüber, was
              du erlebt hast oder wer du bist - nur, dass es für uns gerade nicht passt. Danke, dass
              du dich gezeigt hast. Ehrlich. Und falls du selbst gerade zwischen den Welten stehst:
              Als Klient:in bist du hier weiterhin genau richtig.
            </p>
          </Card>
        )}

        {application.status === "ACCEPTED" && (
          <Card className="space-y-5 p-8">
            <Badge tone="pine">Angenommen</Badge>
            <p className="leading-relaxed text-ink-soft">
              Willkommen im Team. Wir glauben, dass du Menschen etwas mitgeben kannst, das man
              nicht in Büchern findet. Der nächste Schritt: dein öffentliches Profil - damit
              Klient:innen wissen, wer du bist.
            </p>
            <ButtonLink href="/plattform/berater-profil" variant="primary">
              Erstell jetzt dein öffentliches Profil
            </ButtonLink>
          </Card>
        )}
      </div>
    );
  }

  // Noch keine Bewerbung: Formular.
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader subtitle="Du warst selbst dort, wo unsere Klient:innen gerade stehen? Dann erzähl uns davon. Kein perfekter Lebenslauf nötig - uns interessiert, wer du bist und was du kennst." />
      <ApplicationForm docHint={uploadHint(FILE_KINDS.APPLICATION_DOC)} />
    </div>
  );
}
