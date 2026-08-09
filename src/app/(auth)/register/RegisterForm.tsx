"use client";

import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, idleState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "error" && (
        <Alert tone="error">{state.message}</Alert>
      )}

      <Field
        label="Name oder Pseudonym"
        htmlFor="register-displayName"
        hint="Du musst deinen echten Namen nicht nennen - ein Pseudonym reicht völlig."
        error={fieldErrors?.displayName}
        required
      >
        <Input
          id="register-displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          maxLength={60}
          placeholder="z. B. Nachtfalter"
          required
        />
      </Field>

      <Field
        label="E-Mail"
        htmlFor="register-email"
        error={fieldErrors?.email}
        required
      >
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="du@example.com"
          required
        />
      </Field>

      <Field
        label="Passwort"
        htmlFor="register-password"
        hint="Mindestens 8 Zeichen."
        error={fieldErrors?.password}
        required
      >
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <Field
        label="Passwort wiederholen"
        htmlFor="register-passwordConfirm"
        error={fieldErrors?.passwordConfirm}
        required
      >
        <Input
          id="register-passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Einen Moment …" : "Konto anlegen"}
      </Button>
    </form>
  );
}
