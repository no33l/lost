"use client";

import { useActionState, useState } from "react";
import { saveAdvisorProfile } from "@/lib/actions/advisor-profile";
import { idleState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";

const MIN_BIO_LENGTH = 80;

const fileInputStyles =
  "block w-full cursor-pointer rounded-xl border border-dashed border-line bg-card px-4 py-3 text-sm text-ink-soft transition-colors file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-coral-soft file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-coral hover:border-ink/30 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15";

type AdvisorProfileFormProps = {
  /** Upload-Hinweis fürs Foto, serverseitig aus der Storage-Konfiguration. */
  photoHint: string;
  initial: {
    firstName: string;
    lastName: string;
    age: number;
    languages: string;
    bio: string;
    photoUrl: string | null;
    published: boolean;
  } | null;
};

export function AdvisorProfileForm({ photoHint, initial }: AdvisorProfileFormProps) {
  const [state, formAction, isPending] = useActionState(saveAdvisorProfile, idleState);
  const [bio, setBio] = useState(initial?.bio ?? "");
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const remaining = MIN_BIO_LENGTH - bio.trim().length;

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && <Alert tone="error">{state.message}</Alert>}
      {state.status === "success" && (
        <Alert tone="success">{state.message ?? "Gespeichert."}</Alert>
      )}

      <Card className="space-y-5 p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Vorname" htmlFor="firstName" required error={fieldErrors?.firstName}>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              maxLength={60}
              defaultValue={initial?.firstName ?? ""}
            />
          </Field>
          <Field label="Nachname" htmlFor="lastName" required error={fieldErrors?.lastName}>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              maxLength={60}
              defaultValue={initial?.lastName ?? ""}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Alter" htmlFor="age" required error={fieldErrors?.age}>
            <Input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={18}
              max={99}
              required
              defaultValue={initial?.age ?? ""}
            />
          </Field>
          <Field
            label="Sprachen"
            htmlFor="languages"
            required
            hint="Kommagetrennt, z. B. Deutsch, Englisch"
            error={fieldErrors?.languages}
          >
            <Input
              id="languages"
              name="languages"
              required
              maxLength={200}
              defaultValue={initial?.languages ?? ""}
            />
          </Field>
        </div>

        <Field
          label="Beschreibung"
          htmlFor="bio"
          required
          hint="Kein Lebenslauf. Erzähl, wer du bist und was du kennst."
          error={fieldErrors?.bio}
        >
          <>
            <Textarea
              id="bio"
              name="bio"
              rows={7}
              required
              minLength={MIN_BIO_LENGTH}
              maxLength={3000}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
            <p aria-live="polite" className="text-right text-xs text-ink-faint">
              {remaining > 0
                ? `Noch mindestens ${remaining} Zeichen`
                : `${bio.trim().length} Zeichen`}
            </p>
          </>
        </Field>

        <Field label="Foto" htmlFor="foto" hint={photoHint} error={fieldErrors?.foto}>
          <div className="space-y-3">
            {initial?.photoUrl && (
              <div className="flex items-center gap-3">
                {/* Auth-geschützte Quelle (/api/files/*) bzw. lokales SVG - plain <img>. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={initial.photoUrl}
                  alt="Dein aktuelles Profilfoto"
                  className="size-20 rounded-full border border-line object-cover"
                />
                <p className="text-xs text-ink-faint">
                  Dein aktuelles Foto. Lade ein neues hoch, um es zu ersetzen.
                </p>
              </div>
            )}
            <input
              id="foto"
              name="foto"
              type="file"
              accept="image/*"
              className={fileInputStyles}
            />
          </div>
        </Field>
      </Card>

      <Card className="p-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={initial?.published ?? false}
            className="mt-0.5 size-5 cursor-pointer rounded accent-coral"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">Profil sichtbar schalten</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
              Erst wenn du hier den Haken setzt, erscheinst du in der Berater-Übersicht für
              Klient:innen.
            </span>
          </span>
        </label>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Wird gespeichert …" : "Profil speichern"}
        </Button>
      </div>
    </form>
  );
}
