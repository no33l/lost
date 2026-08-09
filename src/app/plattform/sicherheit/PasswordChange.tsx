"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/two-factor";
import { idleState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export function PasswordChange() {
  const [state, formAction, pending] = useActionState(changePasswordAction, idleState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">Passwort ändern</h2>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">
        Danach wirst du zur Sicherheit auf allen Geräten abgemeldet und meldest dich mit dem neuen
        Passwort neu an.
      </p>

      <form action={formAction} noValidate className="mt-5 max-w-sm space-y-4">
        {state.status === "error" && <Alert tone="error">{state.message}</Alert>}

        <Field
          label="Aktuelles Passwort"
          htmlFor="password-current"
          error={fieldErrors?.currentPassword}
          required
        >
          <Input
            id="password-current"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        <Field
          label="Neues Passwort"
          htmlFor="password-new"
          hint="Mindestens 8 Zeichen."
          error={fieldErrors?.newPassword}
          required
        >
          <Input
            id="password-new"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field
          label="Neues Passwort wiederholen"
          htmlFor="password-new-confirm"
          error={fieldErrors?.newPasswordConfirm}
          required
        >
          <Input
            id="password-new-confirm"
            name="newPasswordConfirm"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "Einen Moment …" : "Passwort ändern"}
        </Button>
      </form>
    </Card>
  );
}
