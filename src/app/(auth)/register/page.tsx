import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, isSessionTwoFactorOk } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Konto anlegen - Lost.",
};

export default async function RegisterPage() {
  const auth = await getCurrentSession();
  if (auth) {
    if (!isSessionTwoFactorOk(auth)) redirect("/login/2fa");
    redirect("/plattform");
  }

  return (
    <Card className="sm:p-8">
      <h1 className="font-display text-3xl text-ink">Schön, dass du da bist.</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Ein Konto dauert eine Minute - und du entscheidest, wie viel du von dir zeigst.
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <ul className="mt-6 space-y-2.5 rounded-xl bg-paper-soft p-4 text-xs leading-relaxed text-ink-soft">
        <li className="flex gap-2.5">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pine" />
          <span>
            <span className="font-semibold text-ink">Vertraulich.</span> Beratungen laufen privat
            zwischen dir und deiner Berater:in - die Plattform liest nicht mit.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lilac" />
          <span>
            <span className="font-semibold text-ink">Pseudonym ist okay.</span> Du musst deinen
            echten Namen nirgends angeben.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-coral" />
          <span>
            <span className="font-semibold text-ink">Kostenlos.</span> Das Konto kostet nichts -
            bezahlt wird nur eine Beratung, wenn du eine willst.
          </span>
        </li>
      </ul>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Schon ein Konto?{" "}
        <Link
          href="/login"
          className="font-medium text-coral underline-offset-2 hover:underline"
        >
          Einloggen
        </Link>
      </p>
    </Card>
  );
}
