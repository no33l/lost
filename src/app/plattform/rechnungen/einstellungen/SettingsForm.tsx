"use client";

import { useActionState } from "react";
import { ImageIcon } from "lucide-react";
import { saveInvoiceSettings } from "@/lib/actions/invoice";
import { idleState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";

type SettingsFormProps = {
  defaults: {
    businessName: string;
    addressLine1: string;
    addressLine2: string;
    vatId: string;
    iban: string;
    defaultService: string;
    defaultUnitPriceEuro: string;
    footerText: string;
  };
  logoUrl: string | null;
  logoHint: string;
  nextNumberPreview: string;
};

export function SettingsForm({ defaults, logoUrl, logoHint, nextNumberPreview }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(saveInvoiceSettings, idleState);
  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" && (
        <Alert tone="error" title="Das hat noch nicht geklappt.">
          {state.message}
        </Alert>
      )}
      {state.status === "success" && (
        <Alert tone="success">{state.message ?? "Gespeichert."}</Alert>
      )}

      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Absender:in</h2>
          <p className="mt-1 text-sm text-ink-soft">So stehst du im Kopf deiner Rechnungen.</p>
        </div>

        <Field
          label="Name / Firma auf der Rechnung"
          htmlFor="businessName"
          error={fieldErrors.businessName}
        >
          <Input
            id="businessName"
            name="businessName"
            defaultValue={defaults.businessName}
            autoComplete="organization"
            placeholder="z. B. Mira Anders - Lebens- und Sozialberatung"
          />
        </Field>

        <Field label="Adresse" htmlFor="addressLine1" error={fieldErrors.addressLine1}>
          <Input
            id="addressLine1"
            name="addressLine1"
            defaultValue={defaults.addressLine1}
            autoComplete="street-address"
            placeholder="Straße und Hausnummer"
          />
        </Field>

        <Field
          label="Adresse (Zeile 2)"
          htmlFor="addressLine2"
          error={fieldErrors.addressLine2}
        >
          <Input
            id="addressLine2"
            name="addressLine2"
            defaultValue={defaults.addressLine2}
            placeholder="PLZ und Ort"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="UID"
            htmlFor="vatId"
            hint="Optional - nur wenn du umsatzsteuerpflichtig bist."
            error={fieldErrors.vatId}
          >
            <Input id="vatId" name="vatId" defaultValue={defaults.vatId} placeholder="ATU12345678" />
          </Field>

          <Field
            label="IBAN"
            htmlFor="iban"
            hint="Landet als Zahlungshinweis auf der Rechnung."
            error={fieldErrors.iban}
          >
            <Input
              id="iban"
              name="iban"
              defaultValue={defaults.iban}
              placeholder="AT12 3456 7890 1234 5678"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Standard-Leistung</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Wird bei neuen Rechnungen vorausgefüllt - du kannst jede Position trotzdem anpassen.
          </p>
        </div>

        <Field label="Standard-Leistung" htmlFor="defaultService" error={fieldErrors.defaultService}>
          <Input
            id="defaultService"
            name="defaultService"
            defaultValue={defaults.defaultService}
            placeholder="z. B. Lebensberatung, Einzelgespräch (60 Min)"
          />
        </Field>

        <Field
          label="Standard-Preis (EUR)"
          htmlFor="defaultUnitPrice"
          error={fieldErrors.defaultUnitPrice}
        >
          <Input
            id="defaultUnitPrice"
            name="defaultUnitPrice"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            defaultValue={defaults.defaultUnitPriceEuro}
            placeholder="80,00"
            className="sm:max-w-48"
          />
        </Field>

        <Field
          label="Fußzeile"
          htmlFor="footerText"
          hint="Steht klein unter jeder Rechnung - z. B. Dank, Zahlungsziel, rechtliche Hinweise."
          error={fieldErrors.footerText}
        >
          <Textarea
            id="footerText"
            name="footerText"
            defaultValue={defaults.footerText}
            rows={3}
            placeholder="Danke für dein Vertrauen."
          />
        </Field>
      </Card>

      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Logo</h2>
          <p className="mt-1 text-sm text-ink-soft">Dein Logo landet auf deinen Rechnungs-PDFs.</p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Aktuelles Rechnungs-Logo"
              className="h-16 max-w-40 rounded-lg border border-line bg-card object-contain p-1.5"
            />
          ) : (
            <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-line text-ink-faint">
              <ImageIcon className="size-6" aria-hidden />
              <span className="sr-only">Noch kein Logo hochgeladen</span>
            </div>
          )}
          <div className="min-w-0 flex-1 basis-64">
            <Field
              label={logoUrl ? "Logo ersetzen" : "Logo hochladen"}
              htmlFor="logo"
              hint={logoHint}
              error={fieldErrors.logo}
            >
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg"
                className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink/5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-ink/10"
              />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper-soft/60 px-5 py-4">
        <p className="text-sm text-ink-soft">
          Deine nächste Rechnungsnummer:{" "}
          <span className="font-semibold tabular-nums text-ink">{nextNumberPreview}</span>
          <span className="block text-xs text-ink-faint">Zählt automatisch hoch - du musst nichts tun.</span>
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Speichert …" : "Vorlage speichern"}
        </Button>
      </div>
    </form>
  );
}
