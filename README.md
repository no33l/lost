# Lost. — Main Website + Plattform für Lebensberatung

> „Du bist nicht kaputt. Du bist zwischen den Welten."

Eine zusammenhängende Web-Anwendung aus zwei Teilen:

1. **Main Website** (öffentlich): Landing, Über uns, Berater-Teaser, Events, Kontakt, Login, Register.
2. **Plattform / Panel** (eingeloggt): drei Rollen (Klient:in, Lebensberater:in, Admin), Berater-Verzeichnis, Echtzeit-Chat, Bewerbungs-Flow, Rechnungswesen mit PDF-Export.

Gleiche Domain, geteiltes Design-System, geteilte Auth — Login/Register führen direkt in die Plattform.

## Stack

| Bereich | Technologie |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 — Design-Tokens als CSS-Variablen in `src/app/globals.css` |
| Schriften | Figtree (Sans) + Fraunces (Display-Serif) via `next/font`, als CSS-Variablen (`--font-sans`, `--font-display`) — Tausch gegen Styrene/Copernicus ist ein Einzeiler in `src/app/layout.tsx` |
| Datenbank | Prisma ORM + **SQLite** (Dev) — PostgreSQL-ready, siehe unten |
| Auth | Eigene DB-Session-Auth (HTTP-only-Cookie, Token nur als SHA-256-Hash in der DB), bcryptjs, Rate-Limiting |
| 2FA | TOTP via `otplib` + QR-Code, Recovery-Codes; serverseitig hart erzwungen für Berater:innen/Admins |
| Chat | Server-Sent Events + persistente Nachrichten in der DB |
| Uploads | Lokal unter `storage/`, **AES-256-GCM-verschlüsselt**, Auslieferung nur über zugriffsgeprüfte API-Route |
| PDF | `pdfkit` serverseitig (Rechnungen inkl. Berater-Logo) |

## Setup & Start

Voraussetzungen: Node.js ≥ 20 (getestet mit 24), npm.

```bash
npm install

# .env anlegen (einmalig):
#   DATABASE_URL="file:./dev.db"
#   ENCRYPTION_KEY=<64 Hex-Zeichen>   → node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#   APP_URL="http://localhost:3000"
# Vorlage: .env.example

npx prisma migrate dev   # Schema anwenden (legt prisma/dev.db an)
npm run db:seed          # Beispiel-Daten einspielen
npm run dev              # → http://localhost:3000
```

Produktions-Build: `npm run build && npm start`. Typecheck: `npm run typecheck`.

## End-to-End-Tests

Die Playwright-Suite (`e2e/lost.spec.ts`) deckt alle Kern-Flows ab: öffentliche Seiten, Registrierung → Chat (inkl. Entstehen der Kund:innen-Beziehung), 2FA-Zwang + TOTP-Setup + Recovery-Codes, 2FA-Login, Rechnung + PDF (beide Seiten) und den Admin-Bewerbungsflow inkl. Dokumentenabruf.

```bash
npm run build        # die Suite läuft gegen den Produktions-Server
npx prisma db seed   # frische Ausgangsdaten
npm run e2e          # 6 Tests, Chromium
npx prisma db seed   # danach: Testdaten wieder zurücksetzen
```

## Seed-Accounts

| Rolle | E-Mail | Passwort | Besonderheit |
| --- | --- | --- | --- |
| Admin | `admin@lost-plattform.at` | `LostAdmin!2026` | 2FA noch nicht eingerichtet (bewusst — zum Testen des Zwangs) |
| Berater:in | `mira@lost-plattform.at` | `LostBerater!2026` | hat Kim als Kundin + 1 Beispiel-Rechnung |
| Berater:in | `jonas@…`, `leyla@…`, `david@…`, `sofia@…`, `elias@…` (je `@lost-plattform.at`) | `LostBerater!2026` | veröffentlichte Profile |
| Klient:in | `kim@example.com` | `LostKlient!2026` | Chat mit Mira, 1 erhaltene Rechnung |
| Klient:in | `noah@example.com` | `LostKlient!2026` | offene Berater-Bewerbung (inkl. Demo-Dokumenten) |

## 2FA testen

Berater:innen und Admins **müssen** 2FA aktivieren — ohne sie sind Kund:innenliste, Rechnungen und Bewerbungen serverseitig gesperrt (`requireSensitive`/`assertSensitive` in `src/lib/session.ts`, nicht nur UI).

1. Als `mira@lost-plattform.at` einloggen → das Dashboard zeigt die Sperr-Warnung; sensible Seiten leiten auf **Sicherheit** um.
2. Unter *Sicherheit* → „2FA einrichten": QR-Code mit einer Authenticator-App scannen (Google Authenticator, Aegis, 1Password …) — oder das angezeigte Secret manuell eintragen.
   Ohne Handy: `node -e "console.log(require('otplib').authenticator.generate('SECRET_VON_DER_SEITE'))"`
3. 6-stelligen Code bestätigen → Recovery-Codes werden **einmalig** angezeigt.
4. Ab jetzt verlangt jeder Login dieser Person den TOTP-Schritt (`/login/2fa`); Recovery-Codes funktionieren dort ebenfalls (einmalig).

## Die wichtigsten Flows zum Durchklicken

- **Klient:in:** Registrieren (Pseudonym reicht) → *Berater* → Gesicht anklicken → „Nachricht schreiben" → Chat. Mit der **ersten gesendeten Nachricht** entsteht die Kund:innen-Beziehung.
- **Berater:in:** *Kund:innen* zeigt nur Personen, die selbst geschrieben haben — erst dann ist „Rechnung stellen" möglich (serverseitig erzwungen). *Rechnungen → Vorlage & Logo* für Stammdaten + Logo-Upload; neue Rechnung → PDF-Download.
- **Bewerbung:** Als Klient:in „Als Lebensberater:in bewerben" (Pflicht: Ausweis + Gewerbeschein, optional Diplome — alles verschlüsselt gespeichert). Als Admin (mit 2FA) unter *Bewerbungen*: Annehmen / Ablehnen / In Kontakt treten (öffnet einen Chat). Annehmen macht den Account zur Berater:in → diese erstellt ihr öffentliches Profil unter *Mein Berater-Profil*.
- **Rechnungen (Klient-Sicht):** *Rechnungen* sammelt Rechnungen **aller** Berater:innen; jede als PDF ladbar.

## Architektur-Notizen

```
src/
  app/
    (site)/        öffentliche Website (Landing, Über uns, Berater-Teaser, Events, Kontakt, Legal)
    (auth)/        Login, Login-2FA, Register
    plattform/     eingeloggter Bereich (rollenbasierte Sidebar in components/platform/PlatformShell)
    api/           files (zugriffsgeprüfte Datei-Auslieferung), chats/[id]/stream (SSE), invoices/[id]/pdf
  components/      ui (Design-System), site, platform
  lib/             session/RBAC, crypto (AES-GCM), totp, storage, rate-limit, chat-bus, actions/*
prisma/            schema, migrations, seed
storage/           verschlüsselte Uploads (gitignored)
```

- **RBAC & 2FA:** `requireUser` → `requireRole` → `requireSensitive` (Seiten, redirect) bzw. `assertSensitive` (Server Actions, wirft). Sensibel = Kund:innenliste, Rechnungen (Berater-Seite), Bewerbungen, Berater/Admin-Chats.
- **Kund:innen-Regel:** `Conversation.clientHasMessaged` wird mit der ersten Klient:innen-Nachricht gesetzt; nur solche Beziehungen erscheinen in der Kund:innenliste und nur an sie darf fakturiert werden (Prüfung in der Server Action, nicht nur im UI).
- **Verschlüsselung:** Uploads (Ausweise!) und TOTP-Secrets werden mit `ENCRYPTION_KEY` (AES-256-GCM) verschlüsselt; Dateien verlassen den Server nur über `/api/files/[id]` mit Berechtigungsprüfung (Bewerbungs-Dokumente: nur Admins **mit 2FA**).
- **CSRF/Sessions:** Alle Mutationen laufen über Server Actions (Origin-geprüft); Session-Cookie ist HTTP-only, SameSite=Lax; in der DB liegt nur der Token-Hash.

## Wechsel auf PostgreSQL

1. In `prisma/schema.prisma`: `provider = "postgresql"`; in `.env`: `DATABASE_URL=postgresql://…`
2. `prisma/migrations` löschen (SQLite-spezifisch) und `npx prisma migrate dev --name init` neu erzeugen, dann `npm run db:seed`.

## Getroffene Annahmen

- **SQLite statt PostgreSQL im Dev-Setup** — auf der Zielmaschine ist weder PostgreSQL noch Docker verfügbar; so läuft das Projekt ohne Zusatzinstallation. Schema/Code sind Postgres-kompatibel gehalten (Geldbeträge als Integer-Cents, String-Unions statt Enums).
- **Eigene Session-Auth statt NextAuth/Lucia** — der harte 2FA-Zwang (halb-verifizierte Sessions, Recovery-Codes, rollenabhängige Pflicht) ist so sauber kontrollierbar; Lucia selbst ist als Bibliothek deprecated und empfiehlt genau dieses Muster. `bcryptjs` statt Argon2, um native Windows-Builds zu vermeiden.
- **Erstkontakt** — das Konzeptpapier nennt WhatsApp/Signal für den anonymen Erstkontakt (und bricht dort ab). In der Plattform ist der Erstkontakt als anonymer Chat umgesetzt (Pseudonym reicht); WhatsApp/Signal-Links pro Berater-Profil wären eine sinnvolle nächste Ausbaustufe.
- **Chats von Berater:innen/Admins** zählen als sensible Funktion (sie offenbaren die Kund:innenliste) und stehen daher ebenfalls hinter dem 2FA-Zwang; Klient:innen chatten ohne Hürde.
- **Anonymität vor Buchhaltung** — Rechnungen gehen an den Anzeigenamen (Pseudonym möglich); Berater:innen können optional einen Klarnamen als Rechnungsempfänger eintragen.
- **Konto-Löschung** ist für Klient:innen self-service; hängen Rechnungen am Konto, wird sie mit Hinweis auf Aufbewahrungspflichten blockiert (manueller Weg über hello@).
- **Berater-Fotos** sind generierte, abstrakte SVG-Platzhalter — echte, unretuschierte Fotos ersetzen sie 1:1 unter `public/berater/` bzw. per Upload im Berater-Profil.
- **Impressum/Datenschutz** sind gekennzeichnete Muster, kein Rechtsrat.

## Offene Punkte für die nächste Ausbaustufe

- E-Mail-Versand (Verifikation, Passwort-Reset, Benachrichtigung bei neuer Nachricht/Rechnung).
- Provisions-Abrechnung (10 % per monatlicher Selbstauskunft) und Mitgliedsbeiträge der Berater:innen als eigenes Modul.
- Event-Anmeldungen; Content-Bereich (Texte/Videos) als „Tür" gemäß Konzept.
- Objekt-Storage (S3) + Redis (Rate-Limit, SSE-Pub/Sub) für horizontalen Betrieb; E-Mail-Änderung mit Bestätigung.
- Echte Fonts (Styrene/Copernicus) einhängen; echte Fotografie.
