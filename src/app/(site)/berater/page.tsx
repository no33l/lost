import type { Metadata } from "next";
import { Lock, ScanFace } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { FaceCollage } from "@/components/site/FaceCollage";

export const metadata: Metadata = {
  title: "Berater",
  description:
    "Menschen mit eigener Geschichte statt Titeln und Lebensläufen. Das volle Verzeichnis der Lost.-Berater:innen siehst du nach der Registrierung - pseudonym und vertraulich.",
};

const fragments = [
  "Menschen mit Geschichte.",
  "Keine Zeremonien. Nur Gespräch.",
  "Alle waren selbst dort.",
  "Augenhöhe statt Behandlungszimmer.",
  "Los von Substanzen. Nah an der Erfahrung.",
];

export default function BeraterTeaserPage() {
  return (
    <>
      {/* ---------- Intro ---------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 size-[26rem] rounded-full bg-coral-soft opacity-70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-40 size-[28rem] rounded-full bg-lilac-soft opacity-60 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-4 pt-16 text-center sm:px-6 sm:pt-24">
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="Die Gesichter"
              title="Keine Titel. Keine weißen Kittel. Menschen."
              lead="Alle Berater:innen bei Lost. haben selbst intensive Erfahrungen hinter sich - und den Weg zurück. Du wirst hier keine Lebensläufe vergleichen. Du wirst ein Gesicht sehen und spüren, ob du dieser Person schreiben willst."
              align="center"
            />
          </Reveal>
        </div>
      </section>

      {/* ---------- Collage ---------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-soft opacity-50 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal>
            <FaceCollage />
          </Reveal>
        </div>
      </section>

      {/* ---------- Atmosphärische Fragmente ---------- */}
      <section aria-label="Was die Berater:innen ausmacht" className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
          {fragments.map((fragment, index) => (
            <li key={fragment}>
              <Reveal delay={index * 100}>
                <span
                  className={
                    index % 2 === 0
                      ? "font-display text-xl italic tracking-tight text-ink sm:text-2xl"
                      : "font-display text-lg italic tracking-tight text-ink-faint sm:text-xl"
                  }
                >
                  {fragment}
                </span>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Warum kein offenes Verzeichnis ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-card px-6 py-12 text-center shadow-[0_1px_3px_rgba(38,34,28,0.05)] sm:px-12">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-coral-soft text-coral">
              <ScanFace className="size-5" aria-hidden />
            </span>
            <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-balance text-ink sm:text-3xl">
              Das volle Verzeichnis gibt es erst nach der Registrierung.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Nicht aus Geheimniskrämerei, sondern als Schutzraum - für dich und für die Menschen,
              die hier mit ihrer eigenen Geschichte stehen. Drinnen siehst du alle Gesichter,
              ihre Geschichten und kannst direkt schreiben.
            </p>
            <ButtonLink href="/register" size="lg" className="mt-8">
              Zu allen Beratern
            </ButtonLink>
            <p className="mt-4 text-sm text-ink-faint">
              Dauert eine Minute. Pseudonym reicht.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="mx-auto mt-10 flex max-w-md items-start justify-center gap-2.5 text-center text-sm leading-relaxed text-ink-faint">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Alles, was du einer Berater:in schreibst, bleibt zwischen euch beiden. Die Plattform
              liest nicht mit.
            </span>
          </p>
        </Reveal>
      </section>
    </>
  );
}
