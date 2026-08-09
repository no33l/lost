import { ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/rbac";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { DisplayNameForm } from "./DisplayNameForm";
import { DeleteAccountForm } from "./DeleteAccountForm";

const roleBadgeTones: Record<Role, "lilac" | "pine" | "coral"> = {
  CLIENT: "lilac",
  ADVISOR: "pine",
  ADMIN: "coral",
};

export default async function ProfilPage() {
  const { user } = await requireUser();
  const role = user.role as Role;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Dein Konto</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">
          Name, Zugang, Sicherheit - alles an einem Ort. Was du hier einträgst, gehört dir.
        </p>
      </header>

      <Card className="space-y-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Konto-Daten</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Dein Anzeigename ist das, was andere von dir sehen. Ein Pseudonym ist völlig okay.
          </p>
        </div>

        <DisplayNameForm currentName={user.displayName} />

        <Field
          label="E-Mail-Adresse"
          htmlFor="email"
          hint="Eine Änderung der E-Mail-Adresse kommt später."
        >
          <Input
            id="email"
            name="email"
            type="email"
            value={user.email}
            readOnly
            className="bg-paper-soft/60 text-ink-soft"
          />
        </Field>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-ink">Rolle</p>
          <div>
            <Badge tone={roleBadgeTones[role]}>{ROLE_LABELS[role]}</Badge>
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Sicherheit</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Zwei-Faktor-Authentifizierung schützt dein Konto - und alles, was darin besprochen wird.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ShieldCheck
            aria-hidden
            className={user.twoFactorEnabled ? "size-5 text-pine" : "size-5 text-ink-faint"}
          />
          {user.twoFactorEnabled ? (
            <Badge tone="pine">2FA aktiv</Badge>
          ) : (
            <Badge tone="amber">2FA nicht aktiv</Badge>
          )}
        </div>

        <ButtonLink href="/plattform/sicherheit" variant="secondary" size="sm">
          Sicherheitseinstellungen öffnen
        </ButtonLink>
      </Card>

      {role === ROLES.CLIENT && (
        <Card className="space-y-5 border-danger/30">
          <div>
            <h2 className="font-display text-xl font-semibold text-danger">Gefahrenzone</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Wenn du dein Konto löschst, verschwinden dauerhaft: dein Zugang samt aller Sitzungen,
              deine Chats mit allen Nachrichten, deine hochgeladenen Dateien und eine eventuelle
              Bewerbung. Das lässt sich nicht rückgängig machen - und wir behalten nichts davon.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Einzige Ausnahme: Wurden dir bereits Rechnungen ausgestellt, dürfen wir diese aus
              steuerlichen Gründen nicht mitlöschen (Aufbewahrungspflicht) - die Löschung schlägt
              dann fehl. Melde dich in dem Fall bei{" "}
              <a
                href="mailto:hello@lost-plattform.at"
                className="font-medium text-coral underline underline-offset-2 hover:text-coral-bright"
              >
                hello@lost-plattform.at
              </a>
              .
            </p>
          </div>
          <DeleteAccountForm />
        </Card>
      )}
    </div>
  );
}
