import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InvoiceForm } from "./InvoiceForm";

// Neue Rechnung - nur an Personen aus der eigenen Kund:innenliste
// (ADVISORY-Unterhaltung, in der die Klient:in bereits selbst geschrieben hat).
// Die Kund:innenliste verlinkt hierher mit ?kunde=<clientUserId>.

export default async function NeueRechnungPage({
  searchParams,
}: {
  searchParams: Promise<{ kunde?: string }>;
}) {
  const { user } = await requireSensitive(ROLES.ADVISOR);
  const { kunde } = await searchParams;

  const [conversations, settings] = await Promise.all([
    db.conversation.findMany({
      where: { advisorId: user.id, kind: "ADVISORY", clientHasMessaged: true },
      include: { client: true },
      orderBy: { lastMessageAt: "desc" },
    }),
    db.invoiceSettings.findUnique({ where: { advisorId: user.id } }),
  ]);

  const clients = conversations.map((conversation) => ({
    id: conversation.client.id,
    name: conversation.client.displayName,
  }));

  const preselected = clients.some((client) => client.id === kunde) ? kunde! : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/plattform/rechnungen"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Zurück zu den Rechnungen
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">Neue Rechnung</h1>
        <p className="mt-1.5 leading-relaxed text-ink-soft">
          Nummer, Vorlage und Summe kümmern sich um sich selbst - du füllst nur aus, was diesmal
          anders war.
        </p>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users aria-hidden />}
          title="Noch keine Kund:innen - Rechnungen kannst du stellen, sobald dir jemand geschrieben hat."
          description="Sobald eine Klient:in dir die erste Nachricht schickt, taucht sie in deiner Kund:innenliste auf und kann Rechnungen von dir bekommen."
          action={
            <ButtonLink href="/plattform/kunden" variant="secondary" size="sm">
              Zur Kund:innenliste
            </ButtonLink>
          }
        />
      ) : (
        <InvoiceForm
          clients={clients}
          preselectedClientId={preselected}
          defaultService={settings?.defaultService ?? ""}
          defaultUnitPriceEuro={
            settings?.defaultUnitPrice != null ? (settings.defaultUnitPrice / 100).toFixed(2) : ""
          }
        />
      )}
    </div>
  );
}
