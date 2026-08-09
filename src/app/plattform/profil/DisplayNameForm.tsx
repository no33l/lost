"use client";

import { useActionState } from "react";
import { updateDisplayName } from "@/lib/actions/profile";
import { idleState } from "@/lib/action-state";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export function DisplayNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState(updateDisplayName, idleState);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Anzeigename"
        htmlFor="displayName"
        hint="Darf ein Pseudonym sein - niemand muss hier seinen echten Namen tragen."
        error={state.status === "error" ? state.fieldErrors?.displayName : undefined}
      >
        <Input
          id="displayName"
          name="displayName"
          defaultValue={currentName}
          required
          minLength={2}
          maxLength={60}
          autoComplete="nickname"
        />
      </Field>

      {state.status === "error" && !state.fieldErrors?.displayName && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.message}
        </p>
      )}
      {state.status === "success" && state.message && (
        <p role="status" className="text-sm font-medium text-pine">
          {state.message}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Wird gespeichert …" : "Name speichern"}
      </Button>
    </form>
  );
}
