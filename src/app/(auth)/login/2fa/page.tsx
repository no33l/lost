import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession, isTwoFactorRequired } from "@/lib/session";
import { logoutAction } from "@/lib/actions/logout";
import { Card } from "@/components/ui/Card";
import { TwoFactorChallengeForm } from "./TwoFactorChallengeForm";

export const metadata: Metadata = {
  title: "Zwei-Faktor-Bestätigung - Lost.",
};

export default async function TwoFactorChallengePage() {
  const auth = await getCurrentSession();
  if (!auth) redirect("/login");
  if (
    !isTwoFactorRequired() ||
    auth.session.twoFactorVerified ||
    !auth.user.twoFactorEnabled
  ) {
    redirect("/plattform");
  }

  return (
    <Card className="sm:p-8">
      <h1 className="font-display text-3xl text-ink">Kurz bestätigen.</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Dein Konto ist mit Zwei-Faktor-Authentifizierung geschützt. Gib den 6-stelligen Code aus
        deiner Authenticator-App ein - oder einen deiner Recovery-Codes.
      </p>
      <p className="mt-3 text-xs text-ink-faint">
        Angemeldet als <span className="font-medium text-ink-soft">{auth.user.email}</span>
      </p>

      <div className="mt-6">
        <TwoFactorChallengeForm />
      </div>

      <form action={logoutAction} className="mt-5 text-center">
        <button
          type="submit"
          className="rounded text-sm text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
        >
          Anderes Konto verwenden
        </button>
      </form>
    </Card>
  );
}
