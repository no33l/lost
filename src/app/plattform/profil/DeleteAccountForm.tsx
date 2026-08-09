"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "@/lib/actions/profile";
import { idleState } from "@/lib/action-state";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export function DeleteAccountForm() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccount, idleState);

  if (!confirming) {
    return (
      <Button type="button" variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Konto löschen …
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-danger/30 bg-danger-soft/40 p-4">
      <p className="text-sm font-semibold text-ink">
        Letzte Frage, ganz ehrlich: Willst du dein Konto endgültig löschen?
      </p>

      <Field
        label="Passwort zur Bestätigung"
        htmlFor="delete-password"
        required
        error={state.status === "error" ? state.fieldErrors?.password : undefined}
      >
        <Input
          id="delete-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Dein aktuelles Passwort"
        />
      </Field>

      {state.status === "error" && !state.fieldErrors?.password && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Wird gelöscht …" : "Ja, endgültig löschen"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
