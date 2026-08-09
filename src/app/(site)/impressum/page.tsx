import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum der Lost.-Plattform.",
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-prose px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Impressum</h1>

      <Alert tone="warn" title="Muster" className="mt-8">
        Dieses Impressum ist ein Platzhalter und muss vor dem öffentlichen Launch mit den echten
        Angaben der Trägerin ergänzt werden (§ 5 ECG, § 25 MedienG).
      </Alert>

      <div className="mt-10 space-y-8 text-base leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Medieninhaberin &amp; Betreiberin</h2>
          <p className="mt-3">
            Lost. - Plattform für Lebensberatung
            <br />
            [Rechtsform, Name der Trägerin]
            <br />
            [Straße, Hausnummer]
            <br />
            [PLZ] Wien, Österreich
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Kontakt</h2>
          <p className="mt-3">
            E-Mail:{" "}
            <a href="mailto:hello@lost-plattform.at" className="font-medium text-coral underline-offset-2 hover:underline">
              hello@lost-plattform.at
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Unternehmensgegenstand</h2>
          <p className="mt-3">
            Vermittlungsplattform für Lebens- und Sozialberatung (LSB) nach österreichischem
            Berufsrecht. Die Beratungsleistungen selbst erbringen die auf der Plattform
            gelisteten, eigenständig tätigen Lebensberater:innen in eigener Verantwortung.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Haftungshinweis</h2>
          <p className="mt-3">
            Die Plattform vermittelt Kontakte und stellt Infrastruktur bereit. Sie hat keine
            Kenntnis von Beratungsinhalten und übernimmt keine Verantwortung für die Inhalte
            einzelner Beratungen. Lebensberatung ersetzt keine medizinische oder
            psychotherapeutische Behandlung - in akuten Krisen wende dich bitte an die
            Telefonseelsorge (142) oder den Notruf (144).
          </p>
        </section>
      </div>
    </div>
  );
}
