import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { FILE_KINDS, uploadHint } from "@/lib/storage";
import { SettingsForm } from "./SettingsForm";

// Rechnungsvorlage & Logo einer Berater:in - sensible Funktion (2FA-Pflicht).

export default async function RechnungsEinstellungenPage() {
  const { user } = await requireSensitive(ROLES.ADVISOR);

  const settings = await db.invoiceSettings.findUnique({
    where: { advisorId: user.id },
  });

  const nextNumber = settings?.nextInvoiceNumber ?? 1;
  const nextNumberPreview = `${new Date().getFullYear()}-${String(nextNumber).padStart(4, "0")}`;

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
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">Vorlage &amp; Logo</h1>
        <p className="mt-1.5 leading-relaxed text-ink-soft">
          Einmal ordentlich einrichten, nie wieder dran denken: Diese Angaben landen auf jeder
          Rechnung, die du ausstellst.
        </p>
      </div>

      <SettingsForm
        defaults={{
          businessName: settings?.businessName ?? "",
          addressLine1: settings?.addressLine1 ?? "",
          addressLine2: settings?.addressLine2 ?? "",
          vatId: settings?.vatId ?? "",
          iban: settings?.iban ?? "",
          defaultService: settings?.defaultService ?? "",
          defaultUnitPriceEuro:
            settings?.defaultUnitPrice != null
              ? (settings.defaultUnitPrice / 100).toFixed(2)
              : "",
          footerText: settings?.footerText ?? "",
        }}
        logoUrl={settings?.logoFileId ? `/api/files/${settings.logoFileId}` : null}
        logoHint={uploadHint(FILE_KINDS.ADVISOR_LOGO)}
        nextNumberPreview={nextNumberPreview}
      />
    </div>
  );
}
