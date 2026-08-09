import type { Metadata } from "next";
import { Check, Lock, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Warum es Lost. gibt: Lebensberatung für Menschen zwischen den Welten - auf Augenhöhe, mit Berater:innen, die selbst dort waren. Über das Konzept, die Methoden und das, was bewusst fehlt.",
};

const carried = [
  {
    title: "Lebens- und Sozialberatung (LSB)",
    text: "Nach österreichischem Recht - ein geregelter Beruf mit klaren Grenzen, keine Grauzone.",
  },
  {
    title: "Lebensintegrationsprozess (LIP) nach Wilfried Nelles",
    text: "Integration statt Analyse. Der Blick geht nicht zurück auf Schuldige, sondern nach vorn: Wo stehst du jetzt - und was will gelebt werden?",
  },
  {
    title: "Systemische Gesprächsführung",
    text: "Du bist kein Einzelfall im Vakuum. Familie, Freundeskreis, Arbeit - alles spielt mit, und alles darf vorkommen.",
  },
  {
    title: "Philosophische Orientierung",
    text: "Die großen Fragen ernst nehmen, ohne große Antworten zu verkaufen. Manchmal ist die richtige Frage schon die halbe Erdung.",
  },
];

const excluded = [
  "Breathwork und andere Trance-Techniken",
  "Schamanische Praktiken und Rituale",
  "Zeremonien jeder Art",
  "Substanzarbeit und begleitete Trips",
  "Esoterische Systeme und Heilslehren",
  "Gurubindung und Erleuchtungsversprechen",
];

const quality = [
  {
    title: "Ausgewählt, nicht gelistet",
    text: "Jede Berater:in wird von den Gründerinnen persönlich ausgewählt - Bewerbung, Gespräch, Geschichte. Niemand kauft sich hier ein Profil.",
  },
  {
    title: "Fallbesprechung & Supervision",
    text: "Regelmäßige Fallbesprechungen und Supervision gehören verpflichtend dazu. Wer hier berät, arbeitet an der eigenen Klarheit weiter.",
  },
  {
    title: "Ein faires, transparentes Modell",
    text: "Berater:innen zahlen eine Jahresmitgliedschaft, und pro Beratung gehen 10 % Provision an die Plattform. Wir sagen das offen, weil wir finden: Eine Plattform soll mit ihren Berater:innen verdienen - nicht an ihnen vorbei.",
  },
  {
    title: "Klare Grenzen",
    text: "Lebensberatung ist keine Psychotherapie und keine Medizin. Wo etwas anderes gebraucht wird, sagen wir das ehrlich und verweisen weiter.",
  },
];

export default function UeberUnsPage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-24 size-[26rem] rounded-full bg-lilac-soft opacity-60 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-32 size-[24rem] rounded-full bg-coral-soft opacity-60 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">Über uns</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl md:text-6xl">
              Sie sind nicht kaputt. Sie sind zwischen den Welten.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Lost. ist eine Plattform für Lebensberatung - gebaut für Menschen, deren Erfahrungen
              größer waren als der Rahmen, in den sie zurückkommen sollten. Das hier ist die lange
              Version, warum es uns gibt.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- Ausgangslage ---------- */}
      <section className="border-t border-line/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Die Ausgangslage" title="Ein Suchimpuls, kein Absturz." />
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-5 text-base leading-relaxed text-ink-soft sm:text-lg">
              <p>
                Sie sind zwischen 18 und 35. Sie haben synthetische Drogen genommen - nicht aus
                Langeweile und nicht, um sich wegzuschießen, sondern aus einem Suchimpuls: nach
                Tiefe, nach Bedeutung, nach etwas, das größer ist als der Alltag. Und manche haben
                dort tatsächlich etwas erlebt, das sie seither nicht mehr loslässt.
              </p>
              <p>
                Zurück blieb ein Riss. Kein Schaden - ein Riss. Zwischen dem, was sie gesehen
                haben, und dem Leben, das weiterläuft, als wäre nichts gewesen. Sie funktionieren,
                oft sogar gut. Aber ein Teil von ihnen steht noch woanders.
              </p>
              <p className="font-medium text-ink">
                Sie sind nicht kaputt. Sie sind zwischen den Welten. Und genau dort holt Lost. sie
                ab.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Die Lücke im System ---------- */}
      <section className="bg-paper-soft/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Die Lücke im System" title="Guter Wille reicht nicht." />
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-5 text-base leading-relaxed text-ink-soft sm:text-lg">
              <p>
                Wer mit solchen Erfahrungen in eine klassische Praxis geht, erlebt oft dasselbe:
                echtes Bemühen - und Ratlosigkeit. Nicht, weil Therapeut:innen schlecht wären,
                sondern aus Erfahrungsmangel. Wer nie dort war, kann schwer einordnen, was dort
                passiert ist. Im besten Fall wird vorsichtig umkreist, im schlechtesten
                pathologisiert.
              </p>
              <p>
                Was fehlt, ist Begleitung auf Augenhöhe: Menschen, die selbst durchs Feuer
                gegangen sind - und heil, klar und mit beiden Beinen am Boden zurückgekommen sind.
                Menschen, denen man nichts erklären muss, bevor man anfangen kann zu reden.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Das Konzept ---------- */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Das Konzept" title="Niederschwellig, freaky, ehrlich." />
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-5 text-base leading-relaxed text-ink-soft sm:text-lg">
              <p>
                Lost. ist bewusst keine Klinik und will auch nicht so aussehen. Keine
                Anamnesebögen, keine Diagnose-Codes, kein Flurgeruch. Stattdessen: Gesichter,
                Geschichten und Gespräche, die sich anfühlen wie ein gutes Gespräch um drei Uhr
                nachts - nur mit jemandem, der weiß, was er tut.
              </p>
              <p>
                Alle Berater:innen sind selbst los von Substanzen und arbeiten als Lebens- und
                Sozialberater:innen nach österreichischem Recht. Das gemeinsame Fundament ist der
                Lebensintegrationsprozess (LIP) nach Wilfried Nelles: Integration statt Analyse.
                Der Mensch ist nicht kaputt - er ist steckengeblieben. Es geht nicht darum, die
                Erfahrung zu sezieren, sondern darum, sie in das Leben zu holen, das jetzt dran
                ist.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Das Angebot ---------- */}
      <section className="bg-paper-soft/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <Reveal>
            <SectionHeading eyebrow="Das Angebot" title="Content als Tür. Gespräch als Raum." />
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-5 text-base leading-relaxed text-ink-soft sm:text-lg">
              <p>
                Draußen - auf den Kanälen, wo die Zielgruppe ohnehin ist - steht der Content:
                ehrlich, direkt, ohne Ratgeber-Weichzeichner. Er ist die Tür. Wer durch sie
                hindurchgeht, landet hier: bei Einzelberatung, online oder in Wien.
              </p>
              <p>
                Der Weg dorthin ist absichtlich kurz: registrieren (Pseudonym reicht), ein Gesicht
                auswählen, schreiben. Kein Formular, kein Wartezimmer, keine Überweisung. Die
                erste Nachricht schreibst du, wann du bereit bist - nicht, wann ein Kalender es
                erlaubt.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Methoden - und was bewusst fehlt ---------- */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Methoden"
              title="Was getragen wird - und was bewusst fehlt."
              lead="Lost. ist schmal gebaut, mit Absicht. Was wir tun, tun wir ganz. Was wir nicht tun, lassen wir ganz."
              align="center"
            />
          </Reveal>
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <Reveal delay={100}>
              <div className="h-full rounded-2xl border border-pine/20 bg-pine-soft/60 p-7">
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                  Was getragen wird
                </h3>
                <ul className="mt-6 space-y-5">
                  {carried.map((item) => (
                    <li key={item.title} className="flex gap-3">
                      <Check className="mt-1 size-4 shrink-0 text-pine" aria-hidden />
                      <div>
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={220}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-card p-7">
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                  Was bewusst ausgeschlossen ist
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {excluded.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-soft sm:text-[0.95rem]">
                      <X className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-line pt-5 text-sm leading-relaxed text-ink-soft">
                  Nicht, weil das alles wertlos wäre - es ist ein anderer Weg. Bei Lost. geht es
                  um Erdung durch menschliche Begegnung, nicht um die nächste Erfahrung, die noch
                  tiefer geht.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Qualität ---------- */}
      <section className="bg-night text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Qualität"
              title="Wer hier berät, wurde nicht gelistet, sondern ausgewählt."
              align="center"
              dark
            />
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {quality.map((item, index) => (
              <Reveal key={item.title} delay={index * 100}>
                <div className="h-full rounded-2xl bg-white/5 p-7 ring-1 ring-white/10">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-paper">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-paper/70 sm:text-[0.95rem]">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Vertraulichkeit ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <div className="rounded-3xl bg-pine-soft px-6 py-16 text-center sm:px-16">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pine text-paper">
              <Lock className="size-5" aria-hidden />
            </span>
            <h2 className="mx-auto mt-7 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
              Die Plattform weiß nicht, worüber ihr redet. Absichtlich.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Jede Beratung ist vertraulich und läuft ausschließlich zwischen Klient:in und
              Berater:in. Lost. hat keine Informationen über Inhalte - wir lesen nicht mit, wir
              werten nicht aus, wir geben nichts weiter. Vertrauen ist hier keine Marketingzeile,
              sondern Architektur.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="border-t border-line/60">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
              Klingt nach dir - oder nach jemandem, den du kennst?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Dann schau dir die Gesichter an. Mehr Commitment braucht der erste Schritt nicht.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg">
                Den ersten Schritt machen
              </ButtonLink>
              <ButtonLink href="/berater" variant="ghost" size="lg">
                Die Gesichter ansehen
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
