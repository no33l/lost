import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@prisma/client";
import { Compass, Inbox, MessageCircle, Receipt, ShieldCheck, Users } from "lucide-react";
import { db } from "@/lib/db";
import { hasRequiredTwoFactor, requireUser } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { cn, formatEuro } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function PlattformDashboardPage() {
  const { user } = await requireUser();
  if (user.role === ROLES.ADVISOR) return <AdvisorDashboard user={user} />;
  if (user.role === ROLES.ADMIN) return <AdminDashboard user={user} />;
  return <ClientDashboard user={user} />;
}

/* ----------------------------- Bausteine ----------------------------- */

const statTones = {
  coral: "bg-coral-soft text-coral",
  pine: "bg-pine-soft text-pine",
  lilac: "bg-lilac-soft text-lilac",
  amber: "bg-amber-soft text-amber",
} as const;

type StatCardProps = {
  href: string;
  icon: ReactNode;
  tone: keyof typeof statTones;
  value: string | number;
  label: string;
  sub?: string;
};

function StatCard({ href, icon, tone, value, label, sub }: StatCardProps) {
  return (
    <Link href={href} className="group block h-full rounded-2xl">
      <Card className="flex h-full flex-col gap-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:-translate-y-1">
        <span
          aria-hidden
          className={cn(
            "flex size-11 items-center justify-center rounded-full [&_svg]:size-5",
            statTones[tone]
          )}
        >
          {icon}
        </span>
        <div>
          <p className="font-display text-3xl font-semibold text-ink">{value}</p>
          <p className="mt-1 text-sm font-semibold text-ink">{label}</p>
          {sub && <p className="mt-1 text-xs leading-relaxed text-ink-faint">{sub}</p>}
        </div>
      </Card>
    </Link>
  );
}

function TwoFactorLockCard() {
  return (
    <Alert tone="warn" title="Sensible Funktionen sind gesperrt, bis du 2FA aktivierst.">
      <p>
        Kund:innenliste, Chats und Rechnungen bleiben zu, solange dein Konto nur mit einem Passwort
        gesichert ist. Die Einrichtung dauert zwei Minuten - und schützt die Menschen, die dir hier
        vertrauen.
      </p>
      <div className="mt-4">
        <ButtonLink href="/plattform/sicherheit?grund=pflicht" size="sm">
          <ShieldCheck className="size-4" aria-hidden />
          2FA jetzt aktivieren
        </ButtonLink>
      </div>
    </Alert>
  );
}

function DashboardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <header>
      <h1 className="font-display text-3xl font-semibold text-balance text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">{sub}</p>
    </header>
  );
}

/* ------------------------------ CLIENT ------------------------------- */

async function ClientDashboard({ user }: { user: User }) {
  const [advisorCount, chatCount, latestConversation, invoiceCount] = await Promise.all([
    db.advisorProfile.count({ where: { published: true } }),
    db.conversation.count({ where: { clientId: user.id } }),
    db.conversation.findFirst({
      where: { clientId: user.id },
      orderBy: { lastMessageAt: "desc" },
      include: { advisor: { select: { displayName: true } } },
    }),
    db.invoice.count({ where: { clientId: user.id } }),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title={`Schön, dass du da bist, ${user.displayName}.`}
        sub="Kein Programm, kein Druck. Schau dich um - hier passiert alles in deinem Tempo."
      />

      <Alert tone="success" title="Vertraulich, versprochen.">
        Alles, was du hier besprichst, bleibt zwischen dir und deiner Berater:in. Die Plattform
        liest nicht mit.
      </Alert>

      <section aria-label="Dein Überblick" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          href="/plattform/berater"
          icon={<Compass />}
          tone="coral"
          value={advisorCount}
          label="Berater:innen entdecken"
          sub={
            advisorCount === 1
              ? "Ein Mensch, der zuhört. Kein Ranking, keine Titel."
              : "Menschen, die zuhören. Kein Ranking, keine Titel."
          }
        />
        <StatCard
          href="/plattform/chats"
          icon={<MessageCircle />}
          tone="pine"
          value={chatCount}
          label="Deine Chats"
          sub={
            latestConversation
              ? `Zuletzt mit ${latestConversation.advisor.displayName}`
              : "Noch keine Gespräche - der erste Schritt gehört dir."
          }
        />
        <StatCard
          href="/plattform/rechnungen"
          icon={<Receipt />}
          tone="amber"
          value={invoiceCount}
          label="Rechnungen"
          sub={invoiceCount === 0 ? "Aktuell alles ruhig hier." : "an dich ausgestellt"}
        />
      </section>

      <Card className="flex flex-col gap-5 bg-paper-soft/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Du willst selbst begleiten?</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
            Wenn du deinen eigenen Weg ein Stück weit sortiert hast und weißt, wie sich das Dazwischen
            anfühlt - vielleicht bist du genau die Person, die hier fehlt.
          </p>
        </div>
        <ButtonLink href="/plattform/bewerbung" variant="secondary" size="sm" className="shrink-0">
          Mehr erfahren
        </ButtonLink>
      </Card>
    </div>
  );
}

/* ------------------------------ ADVISOR ------------------------------ */

async function AdvisorDashboard({ user }: { user: User }) {
  if (!hasRequiredTwoFactor(user)) {
    // Bewusst KEINE Kennzahlen laden - ohne 2FA gibt es keine sensiblen Daten.
    return (
      <div className="space-y-8">
        <DashboardHeader
          title={`Hallo, ${user.displayName}.`}
          sub="Bevor es losgeht, fehlt noch ein Schritt: Dein Konto braucht einen zweiten Faktor."
        />
        <TwoFactorLockCard />
      </div>
    );
  }

  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [customerCount, activeChatCount, invoiceStats, profile] = await Promise.all([
    db.conversation.count({
      where: { advisorId: user.id, kind: "ADVISORY", clientHasMessaged: true },
    }),
    db.conversation.count({
      where: {
        advisorId: user.id,
        kind: "ADVISORY",
        clientHasMessaged: true,
        lastMessageAt: { gte: weekAgo },
      },
    }),
    db.invoice.aggregate({
      where: { advisorId: user.id },
      _count: true,
      _sum: { totalCents: true },
    }),
    db.advisorProfile.findUnique({ where: { userId: user.id } }),
  ]);

  const invoiceCount = invoiceStats._count;
  const invoiceSum = invoiceStats._sum.totalCents ?? 0;

  return (
    <div className="space-y-8">
      <DashboardHeader
        title={`Hallo, ${user.displayName}.`}
        sub="Deine Gespräche, deine Menschen - hier ist der Überblick."
      />

      {(!profile || !profile.published) && (
        <Alert tone="info" title="Dein Berater-Profil ist noch nicht sichtbar.">
          <p>
            Klient:innen können dich erst finden, wenn dein Profil vollständig ist und du es
            veröffentlicht hast.
          </p>
          <div className="mt-4">
            <ButtonLink href="/plattform/berater-profil" variant="secondary" size="sm">
              Profil vervollständigen
            </ButtonLink>
          </div>
        </Alert>
      )}

      <section aria-label="Deine Kennzahlen" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          href="/plattform/kunden"
          icon={<Users />}
          tone="pine"
          value={customerCount}
          label="Kund:innen"
          sub="Menschen, die dir bereits geschrieben haben"
        />
        <StatCard
          href="/plattform/chats"
          icon={<MessageCircle />}
          tone="lilac"
          value={activeChatCount}
          label="Aktive Chats"
          sub="mit Nachrichten in den letzten 7 Tagen"
        />
        <StatCard
          href="/plattform/rechnungen"
          icon={<Receipt />}
          tone="amber"
          value={invoiceCount}
          label="Ausgestellte Rechnungen"
          sub={invoiceCount > 0 ? `${formatEuro(invoiceSum)} gesamt` : "Noch keine ausgestellt."}
        />
      </section>

      <p className="text-sm leading-relaxed text-ink-faint">
        Zur Erinnerung: Deine Gespräche laufen privat zwischen dir und deinen Klient:innen. Die
        Plattform liest nicht mit - und du bist der Grund, warum das hier funktioniert.
      </p>
    </div>
  );
}

/* ------------------------------- ADMIN ------------------------------- */

async function AdminDashboard({ user }: { user: User }) {
  if (!hasRequiredTwoFactor(user)) {
    return (
      <div className="space-y-8">
        <DashboardHeader
          title={`Hallo, ${user.displayName}.`}
          sub="Bevor du Bewerbungen und Nutzer:innen siehst, braucht dein Konto einen zweiten Faktor."
        />
        <TwoFactorLockCard />
      </div>
    );
  }

  const [pendingApplications, totalUsers, clientCount, advisorCount, publishedProfiles] =
    await Promise.all([
      db.application.count({ where: { status: "PENDING" } }),
      db.user.count(),
      db.user.count({ where: { role: ROLES.CLIENT } }),
      db.user.count({ where: { role: ROLES.ADVISOR } }),
      db.advisorProfile.count({ where: { published: true } }),
    ]);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title={`Hallo, ${user.displayName}.`}
        sub="Der Maschinenraum. Unaufgeregt, wie es sein soll."
      />

      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral"
          >
            <Inbox className="size-5" />
          </span>
          <div>
            <p className="font-display text-3xl font-semibold text-ink">{pendingApplications}</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {pendingApplications === 1 ? "Offene Bewerbung" : "Offene Bewerbungen"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-faint">
              {pendingApplications === 0
                ? "Gerade wartet niemand auf eine Antwort."
                : "Menschen warten auf eine Antwort - lass sie nicht hängen."}
            </p>
          </div>
        </div>
        <ButtonLink
          href="/plattform/admin/bewerbungen"
          variant={pendingApplications > 0 ? "primary" : "secondary"}
          size="sm"
          className="shrink-0"
        >
          Bewerbungen ansehen
        </ButtonLink>
      </Card>

      <section aria-label="Plattform-Kennzahlen" className="grid gap-4 sm:grid-cols-2">
        <StatCard
          href="/plattform/admin/nutzer"
          icon={<Users />}
          tone="pine"
          value={totalUsers}
          label="Nutzer:innen gesamt"
          sub={`${clientCount} Klient:innen · ${advisorCount} Berater:innen`}
        />
        <StatCard
          href="/plattform/berater"
          icon={<Compass />}
          tone="lilac"
          value={publishedProfiles}
          label="Aktive Berater-Profile"
          sub="aktuell im Verzeichnis sichtbar"
        />
      </section>
    </div>
  );
}
