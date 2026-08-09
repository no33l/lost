"use client";

import { useActionState, useState } from "react";
import { submitApplication } from "@/lib/actions/application";
import { idleState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";

const MIN_TEXT_LENGTH = 150;

const fileInputStyles =
  "block w-full cursor-pointer rounded-xl border border-dashed border-line bg-card px-4 py-3 text-sm text-ink-soft transition-colors file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-coral-soft file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-coral hover:border-ink/30 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15";

type ApplicationFormProps = {
  /** Upload-Hinweis (erlaubte Typen/Größe), serverseitig aus der Storage-Konfiguration. */
  docHint: string;
};

export function ApplicationForm({ docHint }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(submitApplication, idleState);
  const [text, setText] = useState("");
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const remaining = MIN_TEXT_LENGTH - text.trim().length;

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && <Alert tone="error">{state.message}</Alert>}
      {state.status === "success" && (
        <Alert tone="success" title="Bewerbung eingereicht">
          {state.message ?? "Deine Bewerbung ist eingegangen."}
        </Alert>
      )}

      <Card className="space-y-5 p-8">
        <h2 className="font-display text-xl font-semibold text-ink">Über dich</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Vorname" htmlFor="firstName" required error={fieldErrors?.firstName}>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              maxLength={60}
            />
          </Field>
          <Field label="Nachname" htmlFor="lastName" required error={fieldErrors?.lastName}>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              maxLength={60}
            />
          </Field>
          <Field label="Alter" htmlFor="age" required error={fieldErrors?.age}>
            <Input id="age" name="age" type="number" inputMode="numeric" min={18} max={99} required />
          </Field>
          <Field label="Geburtsort" htmlFor="birthPlace" required error={fieldErrors?.birthPlace}>
            <Input id="birthPlace" name="birthPlace" required maxLength={120} />
          </Field>
        </div>

        <Field
          label="Gesprochene Sprachen"
          htmlFor="languages"
          required
          hint="Kommagetrennt, z. B. Deutsch, Englisch"
          error={fieldErrors?.languages}
        >
          <Input id="languages" name="languages" required maxLength={200} />
        </Field>

        <Field
          label="Deine Bewerbung"
          htmlFor="text"
          required
          hint="Was hast du erlebt, was hast du daraus mitgenommen - und warum willst du andere begleiten? Schreib, wie du redest."
          error={fieldErrors?.text}
        >
          <>
            <Textarea
              id="text"
              name="text"
              rows={9}
              required
              minLength={MIN_TEXT_LENGTH}
              maxLength={5000}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <p aria-live="polite" className="text-right text-xs text-ink-faint">
              {remaining > 0
                ? `Noch mindestens ${remaining} Zeichen`
                : `${text.trim().length} Zeichen - passt.`}
            </p>
          </>
        </Field>
      </Card>

      <Card className="space-y-5 p-8">
        <h2 className="font-display text-xl font-semibold text-ink">Dokumente</h2>

        <Alert tone="info">
          Deine Dokumente werden verschlüsselt gespeichert und sind ausschließlich für
          Administrator:innen im Bewerbungskontext sichtbar.
        </Alert>

        <Field
          label="Ausweis"
          htmlFor="ausweis"
          required
          hint={docHint}
          error={fieldErrors?.ausweis}
        >
          <input
            id="ausweis"
            name="ausweis"
            type="file"
            accept="application/pdf,image/*"
            required
            className={fileInputStyles}
          />
        </Field>

        <Field
          label="Gewerbeschein / Berechtigung"
          htmlFor="gewerbeschein"
          required
          hint={docHint}
          error={fieldErrors?.gewerbeschein}
        >
          <input
            id="gewerbeschein"
            name="gewerbeschein"
            type="file"
            accept="application/pdf,image/*"
            required
            className={fileInputStyles}
          />
        </Field>

        <Field
          label="Weitere Dokumente (optional)"
          htmlFor="optionale"
          hint={`Bis zu 5 Dateien, z. B. Zertifikate oder Nachweise. ${docHint}`}
          error={fieldErrors?.optionale}
        >
          <input
            id="optionale"
            name="optionale"
            type="file"
            accept="application/pdf,image/*"
            multiple
            className={fileInputStyles}
          />
        </Field>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-ink-faint">
          Mit dem Absenden bestätigst du, dass deine Angaben stimmen.
        </p>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Wird eingereicht …" : "Bewerbung einreichen"}
        </Button>
      </div>
    </form>
  );
}
