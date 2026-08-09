"use client";

import { useActionState } from "react";
import { verifyTwoFactorAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export function TwoFactorChallengeForm() {
  const [state, formAction, pending] = useActionState(verifyTwoFactorAction, idleState);

  // Recovery-Code-Erfolg: kurz erklären, dass der Code verbraucht ist,
  // bevor es weitergeht. (TOTP-Erfolg redirectet direkt.)
  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Recovery-Code akzeptiert">
          {state.message}
        </Alert>
        <ButtonLink href="/plattform" size="lg" className="w-full">
          Weiter zur Plattform
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "error" && <Alert tone="error">{state.message}</Alert>}

      <Field
        label="Code"
        htmlFor="twofactor-code"
        hint="6-stelliger Code aus deiner App - oder ein Recovery-Code im Format xxxx-xxxx."
        required
      >
        <Input
          id="twofactor-code"
          name="code"
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          maxLength={16}
          placeholder="123456"
          className="text-center font-mono tracking-[0.3em] placeholder:tracking-normal"
          required
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Wird geprüft …" : "Bestätigen"}
      </Button>
    </form>
  );
}
