import { redirect } from "next/navigation";
import { FileDown, Plus, Receipt, Settings2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireSensitive, requireUser } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { cn, formatDate, formatEuro } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

// Rechnungsliste - rollenabhängig:
//  - CLIENT:  alle erhaltenen Rechnungen (auch von verschiedenen Berater:innen - gewollt)
//  - ADVISOR: ausgestellte Rechnungen (sensible Funktion → requireSensitive)
//  - ADMIN:   Rechnungen sind Sache von Berater:in und Klient:in → raus hier

const actionLinkClasses =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-ink/25 px-4 text-sm font-medium text-ink transition-all hover:border-ink/50 hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

function InvoiceRow({
  href,
  pdfHref,
  number,
  name,
  date,
  amount,
}: {
  href: string;
  pdfHref: string;
  number: string;
  name: string;
  date: string;
  amount: string;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <div className="min-w-0 flex-1 basis-52">
        <p className="truncate font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-sm text-ink-faint">
          Nr. {number} · {date}
        </p>
      </div>
      <p className="text-base font-semibold tabular-nums text-ink">{amount}</p>
      <div className="flex items-center gap-2">
        <a href={href} className={actionLinkClasses}>
          Ansehen
        </a>
        <a href={pdfHref} className={actionLinkClasses} download>
          <FileDown className="size-4" aria-hidden />
          PDF
        </a>
      </div>
    </li>
  );
}

export default async function RechnungenPage() {
  const { user } = await requireUser();

  if (user.role === ROLES.ADMIN) redirect("/plattform");

  if (user.role === ROLES.CLIENT) {
    const invoices = await db.invoice.findMany({
      where: { clientId: user.id },
      include: { advisor: { include: { advisorProfile: true } } },
      orderBy: { issuedAt: "desc" },
    });

    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-semibold text-ink">Rechnungen</h1>
          <p className="mt-1.5 text-ink-soft">Alles, was dir deine Berater:innen gestellt haben - an einem Ort.</p>
        </header>

        <Alert tone="info">
          Du zahlst immer direkt an deine Berater:in - die Plattform wickelt keine Zahlungen ab und
          kennt eure Gespräche nicht.
        </Alert>

        {invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt aria-hidden />}
            title="Noch keine Rechnungen. Gut so - alles zu seiner Zeit."
            description="Sobald dir eine Berater:in eine Rechnung stellt, taucht sie hier auf."
          />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {invoices.map((invoice) => {
                const profile = invoice.advisor.advisorProfile;
                const advisorName = profile
                  ? `${profile.firstName} ${profile.lastName}`
                  : invoice.advisor.displayName;
                return (
                  <InvoiceRow
                    key={invoice.id}
                    href={`/plattform/rechnungen/${invoice.id}`}
                    pdfHref={`/api/invoices/${invoice.id}/pdf`}
                    number={invoice.number}
                    name={advisorName}
                    date={formatDate(invoice.issuedAt)}
                    amount={formatEuro(invoice.totalCents)}
                  />
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  // ADVISOR - harte 2FA-Bedingung, sonst Redirect zur Einrichtung.
  await requireSensitive(ROLES.ADVISOR);

  const invoices = await db.invoice.findMany({
    where: { advisorId: user.id },
    include: { client: true },
    orderBy: { issuedAt: "desc" },
  });

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const thisYear = invoices.filter((invoice) => invoice.issuedAt >= yearStart);
  const yearTotal = thisYear.reduce((sum, invoice) => sum + invoice.totalCents, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Rechnungen</h1>
          <p className="mt-1.5 text-ink-soft">Deine ausgestellten Rechnungen - sauber nummeriert, als PDF verschickbar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/plattform/rechnungen/einstellungen" variant="secondary" size="sm">
            <Settings2 className="size-4" aria-hidden />
            Vorlage &amp; Logo
          </ButtonLink>
          <ButtonLink href="/plattform/rechnungen/neu" size="sm">
            <Plus className="size-4" aria-hidden />
            Neue Rechnung
          </ButtonLink>
        </div>
      </header>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt aria-hidden />}
          title="Noch keine Rechnung ausgestellt."
          description="Sobald jemand aus deiner Kund:innenliste eine Rechnung braucht, bist du in zwei Minuten fertig - Vorlage sei Dank."
          action={
            <ButtonLink href="/plattform/rechnungen/neu" size="sm">
              Erste Rechnung ausstellen
            </ButtonLink>
          }
        />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {invoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                href={`/plattform/rechnungen/${invoice.id}`}
                pdfHref={`/api/invoices/${invoice.id}/pdf`}
                number={invoice.number}
                name={invoice.recipient || invoice.client.displayName}
                date={formatDate(invoice.issuedAt)}
                amount={formatEuro(invoice.totalCents)}
              />
            ))}
          </ul>
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-b-2xl border-t border-line bg-paper-soft/60 px-5 py-3.5"
            )}
          >
            <p className="text-sm font-medium text-ink-soft">
              Gesamt {new Date().getFullYear()} ({thisYear.length}{" "}
              {thisYear.length === 1 ? "Rechnung" : "Rechnungen"})
            </p>
            <p className="text-base font-semibold tabular-nums text-ink">{formatEuro(yearTotal)}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
