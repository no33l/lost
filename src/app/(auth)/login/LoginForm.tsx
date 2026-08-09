"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, idleState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "error" && (
        <Alert tone="error">{state.message}</Alert>
      )}

      {/* Ziel nach dem Login - wird serverseitig gegen Open Redirects geprüft. */}
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="E-Mail" htmlFor="login-email" error={fieldErrors?.email} required>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="du@example.com"
          required
        />
      </Field>

      <Field label="Passwort" htmlFor="login-password" error={fieldErrors?.password} required>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Einen Moment …" : "Einloggen"}
      </Button>
    </form>
  );
}
