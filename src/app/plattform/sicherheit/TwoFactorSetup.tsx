"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";
import {
  confirmTwoFactorSetup,
  disableTwoFactorAction,
  regenerateRecoveryCodes,
  startTwoFactorSetup,
} from "@/lib/actions/two-factor";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

type TwoFactorSetupProps = {
  initialEnabled: boolean;
  /** ADVISOR/ADMIN: 2FA ist Pflicht - Deaktivieren wird gar nicht angeboten. */
  mandatory: boolean;
};

type SetupData = { secret: string; qrDataUrl: string };

function CopyButton({
  text,
  copied,
  onCopied,
  label = "Kopieren",
}: {
  text: string;
  copied: boolean;
  onCopied: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          onCopied();
        } catch {
          // Clipboard nicht verfügbar - Text bleibt sichtbar und markierbar.
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/40 hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Kopiert" : label}
    </button>
  );
}

export function TwoFactorSetup({ initialEnabled, mandatory }: TwoFactorSetupProps) {
  // Lokaler Überschreiber, damit die UI sofort umspringt; nach dem
  // revalidatePath der Actions zieht der Server-Wert ohnehin nach.
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);
  const enabled = localEnabled ?? initialEnabled;

  const [setup, setSetup] = useState<SetupData | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);

  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [regenCode, setRegenCode] = useState("");
  const [regenError, setRegenError] = useState<string | null>(null);

  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [copied, setCopied] = useState<"secret" | "codes" | null>(null);
  const [setupPending, startSetupTransition] = useTransition();
  const [regenPending, startRegenTransition] = useTransition();
  const [disablePending, startDisableTransition] = useTransition();

  const markCopied = (which: "secret" | "codes") => {
    setCopied(which);
    setTimeout(() => setCopied((current) => (current === which ? null : current)), 2000);
  };

  const handleStart = () => {
    setNotice(null);
    setSetupError(null);
    startSetupTransition(async () => {
      const result = await startTwoFactorSetup();
      if (result.ok) {
        setSetup({ secret: result.secret, qrDataUrl: result.qrDataUrl });
      } else {
        setSetupError(result.message);
      }
    });
  };

  const handleConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSetupError(null);
    startSetupTransition(async () => {
      const result = await confirmTwoFactorSetup(confirmCode);
      if (result.ok) {
        setFreshCodes(result.recoveryCodes);
        setSetup(null);
        setConfirmCode("");
        setLocalEnabled(true);
      } else {
        setSetupError(result.message);
      }
    });
  };

  const handleRegenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegenError(null);
    startRegenTransition(async () => {
      const result = await regenerateRecoveryCodes(regenCode);
      if (result.ok) {
        setFreshCodes(result.recoveryCodes);
        setRegenCode("");
      } else {
        setRegenError(result.message);
      }
    });
  };

  const handleDisable = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisableError(null);
    startDisableTransition(async () => {
      const result = await disableTwoFactorAction(disablePassword);
      if (result.status === "success") {
        setLocalEnabled(false);
        setSetup(null);
        setFreshCodes(null);
        setDisablePassword("");
        setNotice(result.message ?? "2FA ist deaktiviert.");
      } else if (result.status === "error") {
        setDisableError(result.message);
      }
    });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Zwei-Faktor-Authentifizierung</h2>
        <Badge tone={enabled ? "pine" : "neutral"}>{enabled ? "Aktiv" : "Nicht aktiv"}</Badge>
      </div>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">
        Ein zweiter Faktor schützt dein Konto, selbst wenn dein Passwort mal in falsche Hände
        gerät. Alles, was du brauchst, ist eine Authenticator-App auf deinem Handy.
      </p>

      {notice && (
        <Alert tone="success" className="mt-4">
          {notice}
        </Alert>
      )}

      {!enabled && mandatory && (
        <Alert tone="warn" title="2FA ist für deine Rolle verpflichtend" className="mt-4">
          Ohne aktivierte 2FA bleiben Kund:innenliste, Rechnungen und Bewerbungen gesperrt.
        </Alert>
      )}

      {/* ------- Setup-Flow (2FA noch nicht aktiv) ------- */}
      {!enabled && !setup && (
        <div className="mt-5">
          {setupError && (
            <Alert tone="error" className="mb-4">
              {setupError}
            </Alert>
          )}
          <Button onClick={handleStart} disabled={setupPending}>
            {setupPending ? "Einen Moment …" : "2FA jetzt einrichten"}
          </Button>
        </div>
      )}

      {!enabled && setup && (
        <div className="mt-5 rounded-xl border border-line bg-paper-soft p-4 sm:p-5">
          <ol className="space-y-6">
            <li>
              <p className="text-sm font-semibold text-ink">1. QR-Code scannen</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Öffne deine Authenticator-App (z. B. Aegis, 1Password, Google Authenticator) und
                scanne den Code.
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
                <img
                  src={setup.qrDataUrl}
                  alt="QR-Code zum Einrichten der Zwei-Faktor-Authentifizierung"
                  width={176}
                  height={176}
                  className="size-44 shrink-0 rounded-xl border border-line bg-white p-2"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs text-ink-faint">
                    Kein Scanner zur Hand? Gib das Secret von Hand ein:
                  </p>
                  <code
                    data-testid="totp-secret"
                    className="block rounded-lg border border-line bg-card px-3 py-2 font-mono text-sm break-all text-ink"
                  >
                    {setup.secret}
                  </code>
                  <CopyButton
                    text={setup.secret}
                    copied={copied === "secret"}
                    onCopied={() => markCopied("secret")}
                  />
                </div>
              </div>
            </li>
            <li>
              <p className="text-sm font-semibold text-ink">2. Code bestätigen</p>
              <form onSubmit={handleConfirm} className="mt-2 max-w-sm space-y-3">
                <Field label="6-stelliger Code aus der App" htmlFor="twofactor-confirm-code" required>
                  <Input
                    id="twofactor-confirm-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    spellCheck={false}
                    maxLength={10}
                    placeholder="123456"
                    className="font-mono tracking-[0.3em] placeholder:tracking-normal"
                    value={confirmCode}
                    onChange={(event) => setConfirmCode(event.target.value)}
                    required
                  />
                </Field>
                {setupError && <Alert tone="error">{setupError}</Alert>}
                <Button type="submit" disabled={setupPending}>
                  {setupPending ? "Wird geprüft …" : "2FA aktivieren"}
                </Button>
              </form>
            </li>
          </ol>
        </div>
      )}

      {/* ------- Frische Recovery-Codes (einmalige Anzeige) ------- */}
      {enabled && freshCodes && (
        <div className="mt-5 rounded-xl border border-amber-bright/40 bg-amber-soft p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink">Deine Recovery-Codes</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Sichere sie jetzt - z. B. im Passwort-Manager oder auf Papier. Sie werden nie wieder
            angezeigt, und jeder Code funktioniert genau einmal. Damit kommst du rein, falls dein
            Handy mal weg ist.
          </p>
          <ul
            data-testid="recovery-codes"
            className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-sm text-ink"
          >
            {freshCodes.map((recoveryCode) => (
              <li key={recoveryCode}>{recoveryCode}</li>
            ))}
          </ul>
          <div className="mt-3">
            <CopyButton
              text={freshCodes.join("\n")}
              copied={copied === "codes"}
              onCopied={() => markCopied("codes")}
              label="Alle kopieren"
            />
          </div>
        </div>
      )}

      {/* ------- Verwaltung (2FA aktiv) ------- */}
      {enabled && (
        <div className="mt-6 space-y-6">
          <div className="border-t border-line pt-5">
            <h3 className="text-sm font-semibold text-ink">Recovery-Codes neu erzeugen</h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
              Codes verlegt oder fast aufgebraucht? Erzeuge einen neuen Satz - alle alten Codes
              werden dabei ungültig.
            </p>
            <form onSubmit={handleRegenerate} className="mt-3 max-w-sm space-y-3">
              <Field
                label="Zur Bestätigung: Code aus deiner App"
                htmlFor="twofactor-regen-code"
                required
              >
                <Input
                  id="twofactor-regen-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  maxLength={10}
                  placeholder="123456"
                  className="font-mono tracking-[0.3em] placeholder:tracking-normal"
                  value={regenCode}
                  onChange={(event) => setRegenCode(event.target.value)}
                  required
                />
              </Field>
              {regenError && <Alert tone="error">{regenError}</Alert>}
              <Button type="submit" variant="secondary" size="sm" disabled={regenPending}>
                {regenPending ? "Wird erzeugt …" : "Neue Recovery-Codes erzeugen"}
              </Button>
            </form>
          </div>

          <div className="border-t border-line pt-5">
            <h3 className="text-sm font-semibold text-ink">2FA deaktivieren</h3>
            {mandatory ? (
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
                Für deine Rolle ist 2FA verpflichtend - Deaktivieren ist hier bewusst nicht
                vorgesehen.
              </p>
            ) : (
              <>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
                  Danach schützt nur noch dein Passwort dein Konto. Zur Bestätigung brauchen wir es
                  einmal.
                </p>
                <form onSubmit={handleDisable} className="mt-3 max-w-sm space-y-3">
                  <Field label="Dein Passwort" htmlFor="twofactor-disable-password" required>
                    <Input
                      id="twofactor-disable-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={disablePassword}
                      onChange={(event) => setDisablePassword(event.target.value)}
                      required
                    />
                  </Field>
                  {disableError && <Alert tone="error">{disableError}</Alert>}
                  <Button type="submit" variant="danger" size="sm" disabled={disablePending}>
                    {disablePending ? "Einen Moment …" : "2FA deaktivieren"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
