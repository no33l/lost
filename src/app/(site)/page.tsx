import type { Metadata } from "next";
import { ArrowDown, Check, Lock, MessageCircle, ScanFace, UserRoundPlus, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { FaceCollage } from "@/components/site/FaceCollage";

export const metadata: Metadata = {
  title: { absolute: "Lost. - Du bist nicht kaputt. Du bist zwischen den Welten." },
  description:
    "Lebensberatung für Menschen, deren Erfahrungen größer waren als der Rahmen. Ehrlich, vertraulich, auf Augenhöhe - mit Berater:innen, die selbst dort waren. Online oder in Wien.",
};

const steps = [
  {
    number: "01",
    icon: UserRoundPlus,
    title: "Registrieren",
    text: "Ein Name, der nicht dein echter sein muss, eine E-Mail, ein Passwort. Mehr brauchen wir nicht. Kein Fragebogen, keine Diagnose, keine Warteliste.",
  },
  {
    number: "02",
    icon: ScanFace,
    title: "Ein Gesicht auswählen",
    text: "Du siehst Menschen, keine Lebensläufe. Keine Titel, keine Hierarchie - nur Gesichter und Geschichten. Wähl die Person, bei der etwas klickt.",
  },
  {
    number: "03",
    icon: MessageCircle,
    title: "Schreiben, wann du bereit bist",
    text: "Kein Termindruck, kein Wartezimmer. Du schreibst direkt und privat mit deiner Berater:in - vertraulich, ohne dass jemand mitliest. Auch wir nicht.",
  },
];

const notHere = [
  "Keine Klinik-Atmosphäre, keine Diagnosen, kein Patient:innen-Status.",
  "Kein Coaching-Slang, keine 5-Schritte-Formel zu deinem besten Selbst.",
  "Keine Zeremonien, keine Substanzen, keine nächste Technik, die „noch tiefer“ geht.",
];

const insteadHere = [
  "Menschen mit eigener Geschichte, die selbst durchs Feuer gegangen sind.",
  "Begleitung auf Augenhöhe - Gespräch statt Behandlung.",
  "Der Lebensintegrationsprozess nach Wilfried Nelles als Fundament: Integration statt Analyse.",
];

export default function HomePage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        {/* Sanfte Farbflächen im Hintergrund */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-24 size-[28rem] rounded-full bg-coral-soft opacity-70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-32 size-[32rem] rounded-full bg-lilac-soft opacity-70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 size-[24rem] rounded-full bg-amber-soft opacity-60 blur-3xl"
        />

        {/* Schwebende Portraits an den Rändern (ab lg) */}
        <div aria-hidden className="pointer-events-none absolute left-[5%] top-24 hidden w-32 -rotate-6 select-none lg:block xl:w-36">
          <div className="float-a overflow-hidden rounded-2xl shadow-lg shadow-ink/15 ring-1 ring-white/70">
            <img src="/berater/leyla.svg" alt="" className="h-auto w-full" />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute right-[6%] top-16 hidden w-28 rotate-6 select-none lg:block xl:w-32">
          <div className="float-b overflow-hidden rounded-2xl shadow-lg shadow-ink/15 ring-1 ring-white/70">
            <img src="/berater/jonas.svg" alt="" className="h-auto w-full" />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute bottom-24 right-[12%] hidden w-24 -rotate-3 select-none xl:block">
          <div className="float-c overflow-hidden rounded-2xl shadow-lg shadow-ink/15 ring-1 ring-white/70">
            <img src="/berater/sofia.svg" alt="" className="h-auto w-full" />
          </div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-20">
          <h1>
            <span className="block font-display text-[clamp(5.5rem,20vw,14rem)] font-semibold leading-none tracking-tight text-ink">
              Lost<span className="text-coral">.</span>
            </span>
            <span className="mx-auto mt-8 block max-w-3xl font-display text-2xl font-medium tracking-tight text-balance text-ink sm:text-4xl">
              Du bist nicht kaputt. Du bist zwischen den Welten.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Lebensberatung für Menschen, deren Erfahrungen größer waren als der Rahmen, in den sie
            zurückkommen sollten. Ehrlich, direkt, auf Augenhöhe - online oder in Wien.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg">
              Den ersten Schritt machen
            </ButtonLink>
            <ButtonLink href="#wie-es-funktioniert" variant="secondary" size="lg">
              Wie es funktioniert
              <ArrowDown className="size-4" aria-hidden />
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-ink-faint">Pseudonym reicht. Vertraulich sowieso.</p>
        </div>
      </section>

      {/* ---------- Ein Riss, kein Schaden ---------- */}
      <section className="border-t border-line/60 bg-paper-soft/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Warum es Lost. gibt"
              title="Ein Riss ist kein Schaden."
            />
            <p aria-hidden className="mt-8 hidden font-display text-2xl italic leading-snug text-ink-faint md:block">
              „Verdrängen schließt den Riss nicht."
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-5 text-base leading-relaxed text-ink-soft sm:text-lg">
              <p>
                Manche Erfahrungen passen hinterher in kein Gespräch mehr. Du warst irgendwo, wofür
                es im Alltag keine Worte gibt - und jetzt stehst du wieder in der Küche, im Job, in
                der U-Bahn, und alles läuft weiter, als wäre nichts gewesen.
              </p>
              <p>
                Verdrängen schließt den Riss nicht. Pathologisieren auch nicht. Was da ist, will
                nicht wegtherapiert werden - es will integriert werden. In dein Leben, in deine
                Sprache, in deinen ganz normalen Dienstagnachmittag.
              </p>
              <p className="font-medium text-ink">
                Genau dafür gibt es Lost. Nicht, um dich zu reparieren - sondern damit da jemand
                ist, der versteht, wovon du redest. Weil er selbst dort war.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Wie es funktioniert ---------- */}
      <section id="wie-es-funktioniert" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal>
            <SectionHeading
              eyebrow="Wie es funktioniert"
              title="Drei Schritte. Kein Wartezimmer."
              lead="Der Weg zu einem Gespräch soll nicht schwerer sein als das Gespräch selbst."
              align="center"
            />
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 120}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-card p-7 shadow-[0_1px_3px_rgba(38,34,28,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full bg-coral-soft text-coral">
                      <step.icon className="size-5" aria-hidden />
                    </span>
                    <span aria-hidden className="font-display text-4xl font-semibold text-line">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft sm:text-[0.95rem]">
                    {step.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Was hier anders ist (dunkel) ---------- */}
      <section className="bg-night text-paper">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal>
            <SectionHeading
              eyebrow="Was hier anders ist"
              title="Keine Klinik. Kein Coaching. Keine nächste Erfahrung."
              lead="Lost. ist bewusst schmal gebaut: Menschen, Gespräch, Erdung. Alles andere haben wir weggelassen."
              align="center"
              dark
            />
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <Reveal delay={100}>
              <div className="h-full rounded-2xl bg-white/5 p-7 ring-1 ring-white/10">
                <h3 className="font-display text-lg font-semibold tracking-tight text-paper">
                  Was du hier nicht findest
                </h3>
                <ul className="mt-5 space-y-4">
                  {notHere.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-paper/70 sm:text-[0.95rem]">
                      <X className="mt-0.5 size-4 shrink-0 text-coral-bright" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={220}>
              <div className="h-full rounded-2xl bg-white/5 p-7 ring-1 ring-white/10">
                <h3 className="font-display text-lg font-semibold tracking-tight text-paper">
                  Was du stattdessen findest
                </h3>
                <ul className="mt-5 space-y-4">
                  {insteadHere.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-paper/70 sm:text-[0.95rem]">
                      <Check className="mt-0.5 size-4 shrink-0 text-pine-soft" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Berater-Teaser ---------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-1/4 size-[26rem] rounded-full bg-lilac-soft opacity-60 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Die Gesichter"
              title="Menschen, die selbst dort waren."
              lead="Alle Berater:innen bei Lost. kennen das Gebiet aus eigener Erfahrung - und den Weg zurück. Keine Titel, keine weißen Kittel. Nur Menschen, denen du nichts erklären musst."
            />
            <ButtonLink href="/berater" variant="secondary" className="mt-8">
              Die Gesichter kennenlernen
            </ButtonLink>
          </Reveal>
          <Reveal delay={150}>
            <FaceCollage className="mx-auto max-w-xl" />
          </Reveal>
        </div>
      </section>

      {/* ---------- Vertrauen ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <Reveal>
          <div className="rounded-3xl bg-pine-soft px-6 py-16 text-center sm:px-16">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pine text-paper">
              <Lock className="size-5" aria-hidden />
            </span>
            <h2 className="mx-auto mt-7 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl md:text-[2.75rem] md:leading-[1.08]">
              Was hier gesagt wird, bleibt zwischen euch.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Alle Beratungen sind vertraulich und laufen privat zwischen dir und deiner
              Berater:in. Die Plattform liest nicht mit - keine Protokolle, keine Auswertung,
              keine Weitergabe. Und deinen echten Namen musst du nirgends nennen.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------- Abschluss-CTA ---------- */}
      <section className="border-t border-line/60">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
              Du musst das nicht allein sortieren.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Ein Pseudonym, ein Gesicht, eine erste Nachricht. Mehr braucht es nicht - und mehr
              musst du heute auch nicht entscheiden.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg">
                Den ersten Schritt machen
              </ButtonLink>
              <ButtonLink href="/ueber-uns" variant="ghost" size="lg">
                Mehr über Lost.
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
