import type { Metadata } from "next";
import { isTwoFactorRequired, requireUser } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { Alert } from "@/components/ui/Alert";
import { TwoFactorSetup } from "./TwoFactorSetup";
import { PasswordChange } from "./PasswordChange";

export const metadata: Metadata = {
  title: "Sicherheit - Lost.",
};

type SicherheitPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SicherheitPage({ searchParams }: SicherheitPageProps) {
  const { user } = await requireUser();
  const params = await searchParams;

  const mandatory =
    isTwoFactorRequired() && (user.role === ROLES.ADVISOR || user.role === ROLES.ADMIN);
  const showPflichtHinweis = params.grund === "pflicht" && mandatory && !user.twoFactorEnabled;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Sicherheit</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Dein Konto, deine Regeln. Hier verwaltest du Zwei-Faktor-Authentifizierung und dein
          Passwort.
        </p>
      </header>

      {showPflichtHinweis && (
        <Alert tone="error" title="Hier geht es erst mit 2FA weiter">
          Die Seite, die du öffnen wolltest, gehört zu den sensiblen Bereichen - Kund:innenliste,
          Rechnungen, Bewerbungen. Die sind ohne aktivierte Zwei-Faktor-Authentifizierung gesperrt.
          Richte sie unten ein, dauert etwa zwei Minuten.
        </Alert>
      )}

      <TwoFactorSetup initialEnabled={user.twoFactorEnabled} mandatory={mandatory} />

      <PasswordChange />
    </div>
  );
}
