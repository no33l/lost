import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = {
  title: "Datenschutz",
  description:
    "Wie Lost. mit deinen Daten umgeht: Datensparsamkeit, Pseudonymität, Verschlüsselung - und was wir bewusst nicht wissen.",
};

const sections = [
  {
    title: "Das Wichtigste zuerst",
    body: [
      "Alle Beratungen sind vertraulich und finden privat zwischen dir und deiner Berater:in statt. Die Plattform liest nicht mit, wertet nicht aus und gibt nichts weiter - sie hat über die Inhalte deiner Gespräche schlicht keine Informationen, die über die technische Zustellung hinausgehen.",
      "Du kannst Lost. unter einem Pseudonym nutzen. Für die Registrierung brauchen wir nur einen frei gewählten Anzeigenamen, eine E-Mail-Adresse und ein Passwort.",
    ],
  },
  {
    title: "Welche Daten wir verarbeiten",
    body: [
      "Konto: Anzeigename (Pseudonym möglich), E-Mail-Adresse, Passwort (nur als bcrypt-Hash gespeichert), Rolle, Zeitpunkt der Registrierung.",
      "Nachrichten: Chats zwischen dir und deinen Berater:innen werden verschlüsselt übertragen und in der Datenbank gespeichert, damit ihr euer Gespräch fortsetzen könnt. Sie sind ausschließlich für die beiden Beteiligten abrufbar.",
      "Bewerbungen (nur Berater:innen): Name, Alter, Geburtsort, Sprachen, Bewerbungstext sowie hochgeladene Dokumente (Ausweis, Gewerbeschein, optionale Nachweise). Dokumente werden mit AES-256-GCM verschlüsselt gespeichert und sind ausschließlich für Administrator:innen im Bewerbungskontext einsehbar - und auch für diese nur mit aktivierter Zwei-Faktor-Authentifizierung.",
      "Rechnungen: Rechnungsdaten (Positionen, Beträge, Empfänger:in) zwischen Berater:in und Klient:in. Zahlungen laufen direkt zwischen euch - die Plattform wickelt keine Zahlungen ab.",
    ],
  },
  {
    title: "Was wir bewusst nicht tun",
    body: [
      "Kein Tracking, keine Analyse-Cookies, keine Werbenetzwerke. Die Plattform setzt ausschließlich ein technisch notwendiges Session-Cookie für den Login.",
      "Keine Weitergabe an Dritte, keine öffentliche Förderung mit Berichtspflichten, keine Profilbildung.",
    ],
  },
  {
    title: "Speicherdauer & Löschung",
    body: [
      "Dein Konto kannst du in den Konto-Einstellungen selbst löschen; damit werden deine Profildaten, Chats und Sitzungen entfernt. Rechnungen unterliegen gesetzlichen Aufbewahrungspflichten (§ 132 BAO: 7 Jahre) und können daher nicht vorzeitig gelöscht werden - betroffene Konten werden auf Anfrage deaktiviert und pseudonymisiert.",
      "Abgelehnte Bewerbungen inklusive Dokumenten werden nach Abschluss des Verfahrens gelöscht; angenommene Bewerbungen werden Teil der Berater:innen-Akte.",
    ],
  },
  {
    title: "Deine Rechte",
    body: [
      "Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch nach Art. 15-21 DSGVO. Schreib dafür an hello@lost-plattform.at. Beschwerden: Österreichische Datenschutzbehörde (dsb.gv.at).",
    ],
  },
];

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-prose px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Datenschutz</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        Anonymität ist bei Lost. kein Feature, sondern ein Grundprinzip. Diese Seite erklärt, was
        das technisch und rechtlich bedeutet.
      </p>

      <Alert tone="warn" title="Muster" className="mt-8">
        Diese Datenschutzerklärung ist eine sorgfältige Vorlage, aber kein Rechtsrat. Vor dem
        Launch bitte juristisch prüfen und um Verantwortliche/Auftragsverarbeiter ergänzen.
      </Alert>

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl font-semibold text-ink">{section.title}</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-ink-soft">
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
