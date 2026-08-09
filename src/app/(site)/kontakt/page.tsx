import type { Metadata } from "next";
import { ChevronDown, Mail, MessageCircle, ScanFace, UserRoundPlus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Der direkteste Weg zu einer Berater:in führt nicht über uns: registrieren, Gesicht auswählen, schreiben - anonym und vertraulich. Für alles andere: hello@lost-plattform.at.",
};

const miniSteps = [
  {
    icon: UserRoundPlus,
    title: "Registrieren",
    text: "Pseudonym reicht. Kein echter Name nötig.",
  },
  {
    icon: ScanFace,
    title: "Gesicht auswählen",
    text: "Menschen statt Lebensläufe. Du entscheidest, wer passt.",
  },
  {
    icon: MessageCircle,
    title: "Schreiben",
    text: "Direkt und privat an deine Berater:in. Niemand dazwischen.",
  },
];

const faq = [
  {
    question: "Muss ich meinen Namen nennen?",
    answer:
      "Nein. Ein Pseudonym reicht - für die Registrierung und für die Beratung. Deine Berater:in erfährt nur, was du selbst erzählen willst.",
  },
  {
    question: "Was kostet eine Beratung?",
    answer:
      "Bis etwa 80 Euro pro Stunde, je nach Berater:in. Viele arbeiten mit Sliding Scale - wenn gerade wenig geht, sag es einfach. Bezahlt wird direkt an deine Berater:in, nicht an die Plattform.",
  },
  {
    question: "Liest die Plattform mit?",
    answer:
      "Nein. Niemals. Alle Gespräche laufen privat zwischen dir und deiner Berater:in. Wir haben keine Kenntnis von Inhalten - und wollen sie auch nicht haben.",
  },
  {
    question: "Ist das Therapie?",
    answer:
      "Nein. Lost. vermittelt Lebens- und Sozialberatung nach österreichischem Recht - kein Ersatz für Psychotherapie oder medizinische Behandlung. In akuten Krisen wende dich bitte sofort an die Telefonseelsorge unter 142 (rund um die Uhr, kostenlos) oder den Notruf 144.",
  },
  {
    question: "Bin ich hier richtig?",
    answer:
      "Wenn du Erfahrungen gemacht hast, die größer waren als der Rahmen - und seitdem das Gefühl kennst, zwischen den Welten zu stehen: ziemlich sicher ja. Du musst keine Kategorie erfüllen und nichts beweisen. Schreib einfach.",
  },
];

export default function KontaktPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
      <Reveal>
        <SectionHeading
          as="h1"
          eyebrow="Kontakt"
          title="Der direkteste Weg führt nicht über uns."
          lead="Wenn du mit einer Berater:in reden willst, brauchst du kein Kontaktformular und keine Vermittlungsstelle. Der Erstkontakt läuft direkt und anonym - von dir zu ihr, ohne Umweg über die Plattform."
        />
      </Reveal>

      {/* ---------- Der direkte Weg ---------- */}
      <Reveal delay={100}>
        <div className="mt-12 rounded-3xl border border-line bg-card p-6 shadow-[0_1px_3px_rgba(38,34,28,0.05)] sm:p-10">
          <ol className="grid gap-6 sm:grid-cols-3">
            {miniSteps.map((step, index) => (
              <li key={step.title} className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral">
                    <step.icon className="size-4.5" aria-hidden />
                  </span>
                  <span aria-hidden className="font-display text-2xl font-semibold text-line">
                    0{index + 1}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                  {step.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col items-start gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              Du findest hier bewusst kein Kontaktformular. Formulare erzeugen Akten - und Akten
              sind das Gegenteil von dem, was Lost. sein soll. Was du einer Berater:in sagen
              willst, sagst du ihr direkt. Nicht uns.
            </p>
            <ButtonLink href="/register" className="shrink-0">
              Den ersten Schritt machen
            </ButtonLink>
          </div>
        </div>
      </Reveal>

      {/* ---------- Allgemeine Anfragen ---------- */}
      <Reveal delay={150}>
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-paper-soft/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lilac-soft text-lilac">
              <Mail className="size-4.5" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                Für alles andere
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Presse, Kooperationen, Technik oder eine Frage, die nirgends reinpasst - schreib
                uns eine Mail. Aber nichts Persönliches über deine Situation: Das gehört zu deiner
                Berater:in, nicht in unser Postfach.
              </p>
            </div>
          </div>
          <a
            href="mailto:hello@lost-plattform.at"
            className="shrink-0 font-medium text-coral underline-offset-4 hover:underline sm:ml-4"
          >
            hello@lost-plattform.at
          </a>
        </div>
      </Reveal>

      {/* ---------- FAQ ---------- */}
      <section aria-labelledby="faq-heading" className="mt-16">
        <Reveal>
          <h2
            id="faq-heading"
            className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            Kurze Antworten auf echte Fragen
          </h2>
        </Reveal>
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
          {faq.map((item, index) => (
            <details key={item.question} className="group" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-ink transition-colors hover:bg-paper-soft/50 sm:px-6 [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  className="size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft sm:px-6 sm:text-[0.95rem]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
