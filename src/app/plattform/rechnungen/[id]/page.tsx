import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { db } from "@/lib/db";
import { hasRequiredTwoFactor, requireUser } from "@/lib/session";
import { formatDate, formatEuro } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

// Rechnungs-Detail - sichtbar nur für die beiden Beteiligten
// (ausstellende Berater:in bzw. empfangende Klient:in).

export default async function RechnungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireUser();
  const { id } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { position: "asc" } },
      advisor: { include: { advisorProfile: true, invoiceSettings: true } },
      client: true,
    },
  });

  const isAdvisor = invoice?.advisorId === user.id;
  const isClient = invoice?.clientId === user.id;
  if (!invoice || (!isAdvisor && !isClient)) notFound();
  // Für Berater:innen ist das eine sensible Funktion - ohne aktivierte 2FA
  // geht es zuerst zur Einrichtung (skipped when DISABLE_2FA_REQUIREMENT=true).
  if (isAdvisor && !hasRequiredTwoFactor(user)) redirect("/plattform/sicherheit?grund=pflicht");

  const settings = invoice.advisor.invoiceSettings;
  const profile = invoice.advisor.advisorProfile;
  const advisorName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : invoice.advisor.displayName;
  const senderName = settings?.businessName || advisorName;
  const recipientName = invoice.recipient || invoice.client.displayName;
  // Das Logo liefert /api/files nur an die Eigentümer:in aus - Klient:innen
  // sehen hier stattdessen den Absendernamen (im PDF ist das Logo drin).
  const logoUrl = isAdvisor && settings?.logoFileId ? `/api/files/${settings.logoFileId}` : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/plattform/rechnungen"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Alle Rechnungen
        </Link>
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          download
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-coral px-6 text-[0.95rem] font-medium text-white shadow-sm transition-all hover:bg-coral-bright hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
        >
          <FileDown className="size-4.5" aria-hidden />
          Als PDF herunterladen
        </a>
      </div>

      <Card className="p-6 sm:p-10">
        {/* Kopf: Absender links, Logo bzw. Wortmarke rechts */}
        <div className="flex flex-wrap-reverse items-start justify-between gap-6">
          <div className="text-sm leading-relaxed text-ink-soft">
            <p className="font-semibold text-ink">{senderName}</p>
            {settings?.addressLine1 && <p>{settings.addressLine1}</p>}
            {settings?.addressLine2 && <p>{settings.addressLine2}</p>}
            {settings?.vatId && <p>UID: {settings.vatId}</p>}
          </div>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo von ${senderName}`}
              className="h-14 max-w-36 object-contain"
            />
          ) : (
            <p className="font-display text-2xl font-semibold text-ink">{senderName}</p>
          )}
        </div>

        <h1 className="mt-10 font-display text-3xl font-semibold text-ink">
          Rechnung {invoice.number}
        </h1>

        {/* Empfänger + Meta */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Rechnung an</p>
            <p className="mt-1 font-semibold text-ink">{recipientName}</p>
          </div>
          <dl className="space-y-1.5 text-sm sm:text-right">
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-ink-faint">Rechnungsdatum</dt>
              <dd className="font-medium text-ink">{formatDate(invoice.issuedAt)}</dd>
            </div>
            {invoice.serviceDate && (
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-ink-faint">Leistungsdatum</dt>
                <dd className="font-medium text-ink">{formatDate(invoice.serviceDate)}</dd>
              </div>
            )}
            {invoice.dueAt && (
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-ink-faint">Zahlbar bis</dt>
                <dd className="font-medium text-ink">{formatDate(invoice.dueAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Positionen */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="bg-paper-soft text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <th scope="col" className="rounded-l-lg px-3 py-2.5">
                  Pos
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Beschreibung
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  Menge
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  Einzelpreis
                </th>
                <th scope="col" className="rounded-r-lg px-3 py-2.5 text-right">
                  Gesamt
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-line align-top">
                  <td className="px-3 py-3 text-ink-faint">{item.position}</td>
                  <td className="px-3 py-3 text-ink">{item.description}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink">{item.quantity}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink">
                    {formatEuro(item.unitPriceCents)}
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-ink">
                    {formatEuro(item.quantity * item.unitPriceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="px-3 pt-4 text-right font-semibold text-ink">
                  Gesamtbetrag
                </td>
                <td className="px-3 pt-4 text-right text-base font-bold tabular-nums text-ink">
                  {formatEuro(invoice.totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Zahlungs- und Zusatzinfos */}
        <div className="mt-8 space-y-3 text-sm leading-relaxed text-ink-soft">
          {!settings?.vatId && (
            <p>Kein USt-Ausweis (Kleinunternehmerregelung), sofern nicht anders angegeben.</p>
          )}
          {settings?.iban && (
            <p>
              Bitte überweisen an: <span className="font-medium tabular-nums text-ink">IBAN {settings.iban}</span>
            </p>
          )}
          {invoice.note && <p>{invoice.note}</p>}
          {settings?.footerText && (
            <p className="border-t border-line pt-4 text-xs italic text-ink-faint">
              {settings.footerText}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
