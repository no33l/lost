import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, isSessionTwoFactorOk } from "@/lib/session";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Einloggen - Lost.",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getCurrentSession();
  if (auth) {
    if (!isSessionTwoFactorOk(auth)) redirect("/login/2fa");
    redirect("/plattform");
  }

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const hinweis = typeof params.hinweis === "string" ? params.hinweis : undefined;

  return (
    <Card className="sm:p-8">
      <h1 className="font-display text-3xl text-ink">Willkommen zurück.</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Schön, dass du wieder da bist. Alles hier bleibt zwischen dir und deiner Berater:in.
      </p>

      {hinweis === "passwort-geaendert" && (
        <Alert tone="success" title="Passwort geändert" className="mt-5">
          Du wurdest zur Sicherheit auf allen Geräten abgemeldet. Melde dich mit deinem neuen
          Passwort an.
        </Alert>
      )}

      <div className="mt-6">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Noch kein Konto?{" "}
        <Link
          href="/register"
          className="font-medium text-coral underline-offset-2 hover:underline"
        >
          Konto anlegen
        </Link>
      </p>
    </Card>
  );
}
