// Seed-Daten: je ein Account pro Rolle, sechs Berater:innen mit Profilen,
// Beispiel-Events, ein Beispiel-Chat (inkl. Kund:innen-Beziehung), eine
// Beispiel-Rechnung und eine offene Bewerbung mit Demo-Dokumenten.
//
// Läuft über `npm run db:seed` (bzw. automatisch bei `prisma migrate reset`).

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encryptBuffer } from "../src/lib/crypto";

const db = new PrismaClient();

const PASSWORDS = {
  admin: "LostAdmin!2026",
  advisor: "LostBerater!2026",
  client: "LostKlient!2026",
};

// 1×1-PNG als Demo-Dokument (Platzhalter für Ausweis/Gewerbeschein).
const DEMO_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const advisors = [
  {
    email: "mira@lost-plattform.at",
    displayName: "Mira",
    firstName: "Mira",
    lastName: "Steiner",
    age: 29,
    languages: "Deutsch, Englisch",
    photoUrl: "/berater/mira.svg",
    bio: "Ich war lange überall, nur nicht bei mir. Festivals, Träume, zu viel von allem - und danach diese Stille, mit der keiner was anfangen konnte. Heute halt ich genau diese Stille gut aus. Wenn du reden willst: Ich bin da. Wirklich da.",
  },
  {
    email: "jonas@lost-plattform.at",
    displayName: "Jonas",
    firstName: "Jonas",
    lastName: "Weber",
    age: 33,
    languages: "Deutsch",
    photoUrl: "/berater/jonas.svg",
    bio: "Zehn Jahre zwischen Rausch und Suche. Irgendwann hab ich verstanden: Es gibt nichts mehr zu erleben, nur noch was zu integrieren. Seitdem ist es ruhig. Ich sitz gern mit Leuten, die grad da stehen, wo ich mal stand.",
  },
  {
    email: "leyla@lost-plattform.at",
    displayName: "Leyla",
    firstName: "Leyla",
    lastName: "Aydın",
    age: 27,
    languages: "Deutsch, Türkisch, Englisch",
    photoUrl: "/berater/leyla.svg",
    bio: "Zwischen zwei Kulturen, zwischen zwei Welten - ich kenn das Gefühl, nirgends ganz anzukommen. Mich hat niemand „gerettet“. Zuhören hat gereicht. Genau das geb ich weiter.",
  },
  {
    email: "david@lost-plattform.at",
    displayName: "David",
    firstName: "David",
    lastName: "Horvath",
    age: 31,
    languages: "Deutsch, Ungarisch",
    photoUrl: "/berater/david.svg",
    bio: "Ich hab die großen Antworten gesucht und bin in sehr kleinen Momenten fündig geworden. Kaffee. Ein Gespräch, das nicht drängt. Wenn dir alles too much ist - komm, wir sortieren das.",
  },
  {
    email: "sofia@lost-plattform.at",
    displayName: "Sofia",
    firstName: "Sofia",
    lastName: "Brandner",
    age: 26,
    languages: "Deutsch, Englisch, Spanisch",
    photoUrl: "/berater/sofia.svg",
    bio: "Mit 22 hatte ich Einsichten, für die andere fünfzig werden. Nur leben konnte ich damit nicht. Das kam später - langsam, geerdet, echt. Genau da begleite ich dich hin.",
  },
  {
    email: "elias@lost-plattform.at",
    displayName: "Elias",
    firstName: "Elias",
    lastName: "Moser",
    age: 34,
    languages: "Deutsch, Englisch",
    photoUrl: "/berater/elias.svg",
    bio: "Kein Guru, keine Methode, kein Race. Ich hab selber lang gebraucht, um wieder auf dem Boden zu landen. Jetzt bin ich einfach wer, der zuhört und dableibt - auch wenn's unbequem wird.",
  },
];

const events = [
  {
    title: "Offener Abend: Lost & Found",
    date: new Date("2026-09-17T19:00:00+02:00"),
    location: "Wien, Neubau - genaue Location nach Anmeldung",
    description:
      "Kein Programm, keine Bühne. Ein Raum, echte Gespräche, Leute, die verstehen, wovon du redest. Komm vorbei, bleib so lang du willst.",
  },
  {
    title: "Gesprächskreis: Zwischen den Welten",
    date: new Date("2026-10-08T18:30:00+02:00"),
    location: "Wien, Josefstadt",
    description:
      "Ein moderierter Kreis für alle, die Erfahrungen gemacht haben, die größer waren als der Rahmen, der sie hätte halten können. Max. 12 Plätze, Anmeldung über deine Berater:in.",
  },
  {
    title: "Kickoff: Lost. geht online",
    date: new Date("2026-05-22T19:00:00+02:00"),
    location: "Wien, Mariahilf",
    description:
      "Der Abend, an dem aus einer Idee eine Plattform wurde. Danke an alle, die von Anfang an dabei sind.",
  },
  {
    title: "Supervisions-Wochenende (intern)",
    date: new Date("2026-03-14T10:00:00+01:00"),
    location: "Niederösterreich",
    description:
      "Fallbesprechung, Qualitätssicherung und viel ehrliches Feedback unter unseren Berater:innen - außerhalb behördlicher Strukturen, mit echtem fachlichem Anspruch.",
  },
];

async function createDemoDocument(ownerId: string, fileName: string) {
  const storageDir = path.join(process.cwd(), "storage");
  mkdirSync(storageDir, { recursive: true });
  const storedName = `${randomBytes(16).toString("hex")}.bin`;
  writeFileSync(path.join(storageDir, storedName), encryptBuffer(DEMO_PNG));
  return db.storedFile.create({
    data: {
      ownerId,
      kind: "APPLICATION_DOC",
      fileName,
      mimeType: "image/png",
      size: DEMO_PNG.length,
      storedName,
    },
  });
}

async function main() {
  // Reihenfolge wegen Fremdschlüsseln.
  await db.message.deleteMany();
  await db.conversation.deleteMany();
  await db.invoiceItem.deleteMany();
  await db.invoice.deleteMany();
  await db.invoiceSettings.deleteMany();
  await db.applicationDocument.deleteMany();
  await db.application.deleteMany();
  await db.storedFile.deleteMany();
  await db.recoveryCode.deleteMany();
  await db.session.deleteMany();
  await db.advisorProfile.deleteMany();
  await db.event.deleteMany();
  await db.user.deleteMany();

  const admin = await db.user.create({
    data: {
      email: "admin@lost-plattform.at",
      displayName: "Alex",
      role: "ADMIN",
      passwordHash: bcrypt.hashSync(PASSWORDS.admin, 12),
    },
  });

  const advisorUsers = [];
  for (const advisor of advisors) {
    const user = await db.user.create({
      data: {
        email: advisor.email,
        displayName: advisor.displayName,
        role: "ADVISOR",
        passwordHash: bcrypt.hashSync(PASSWORDS.advisor, 12),
        advisorProfile: {
          create: {
            firstName: advisor.firstName,
            lastName: advisor.lastName,
            age: advisor.age,
            languages: advisor.languages,
            bio: advisor.bio,
            photoUrl: advisor.photoUrl,
            published: true,
          },
        },
      },
    });
    advisorUsers.push(user);
  }
  const mira = advisorUsers[0]!;

  const kim = await db.user.create({
    data: {
      email: "kim@example.com",
      displayName: "Kim",
      role: "CLIENT",
      passwordHash: bcrypt.hashSync(PASSWORDS.client, 12),
    },
  });

  const noah = await db.user.create({
    data: {
      email: "noah@example.com",
      displayName: "Noah",
      role: "CLIENT",
      passwordHash: bcrypt.hashSync(PASSWORDS.client, 12),
    },
  });

  for (const event of events) {
    await db.event.create({ data: event });
  }

  // Beispiel-Chat Kim ↔ Mira. Kim hat geschrieben → Kund:innen-Beziehung besteht,
  // Mira darf Rechnungen an Kim stellen.
  const conversation = await db.conversation.create({
    data: {
      clientId: kim.id,
      advisorId: mira.id,
      clientHasMessaged: true,
      lastMessageAt: new Date("2026-07-14T22:41:00+02:00"),
    },
  });

  const chat: Array<[string, string, string]> = [
    [
      kim.id,
      "Hey. Ich weiß nicht genau, wie ich anfangen soll. Ich hab dein Profil gelesen und irgendwas davon hat mich erwischt.",
      "2026-07-14T21:58:00+02:00",
    ],
    [
      mira.id,
      "Hey Kim. Schön, dass du schreibst - anfangen musst du gar nicht können. Magst du erzählen, was grad los ist, oder sollen wir einfach mal einen Termin ausmachen?",
      "2026-07-14T22:10:00+02:00",
    ],
    [
      kim.id,
      "Lieber erstmal schreiben. Seit letztem Sommer fühlt sich alles irgendwie dünn an. Funktionieren geht, aber mehr auch nicht.",
      "2026-07-14T22:26:00+02:00",
    ],
    [
      mira.id,
      "Kenn ich gut, dieses Dünne. Lass uns da in Ruhe hinschauen. Diese Woche hätte ich Donnerstag Abend Zeit - online oder in Wien, wie's für dich passt.",
      "2026-07-14T22:41:00+02:00",
    ],
  ];
  for (const [senderId, body, at] of chat) {
    await db.message.create({
      data: { conversationId: conversation.id, senderId, body, createdAt: new Date(at) },
    });
  }

  // Rechnungsvorlage + Beispiel-Rechnung von Mira an Kim.
  await db.invoiceSettings.create({
    data: {
      advisorId: mira.id,
      businessName: "Mira Steiner - Lebensberatung",
      addressLine1: "Neubaugasse 12/4",
      addressLine2: "1070 Wien",
      iban: "AT12 3456 7890 1234 5678",
      defaultService: "Lebensberatung, Einzelgespräch (60 Min)",
      defaultUnitPrice: 8000,
      footerText: "Danke für dein Vertrauen. Zahlbar innerhalb von 14 Tagen.",
      nextInvoiceNumber: 2,
    },
  });

  await db.invoice.create({
    data: {
      number: "2026-0001",
      advisorId: mira.id,
      clientId: kim.id,
      recipient: "Kim",
      issuedAt: new Date("2026-07-10T12:00:00+02:00"),
      serviceDate: new Date("2026-07-09T18:00:00+02:00"),
      dueAt: new Date("2026-07-24T12:00:00+02:00"),
      note: "Erstgespräch, online.",
      totalCents: 8000,
      items: {
        create: [
          {
            position: 1,
            description: "Lebensberatung, Einzelgespräch (60 Min)",
            quantity: 1,
            unitPriceCents: 8000,
          },
        ],
      },
    },
  });

  // Offene Bewerbung von Noah inkl. Demo-Dokumenten (für den Admin-Reiter).
  const ausweis = await createDemoDocument(noah.id, "demo-ausweis.png");
  const gewerbeschein = await createDemoDocument(noah.id, "demo-gewerbeschein.png");
  await db.application.create({
    data: {
      userId: noah.id,
      firstName: "Noah",
      lastName: "Berger",
      age: 30,
      birthPlace: "Graz",
      languages: "Deutsch, Englisch",
      text: "Ich war fünf Jahre in so ziemlich jeder Szene unterwegs, die Erfahrungen verspricht. Seit drei Jahren bin ich raus, hab die LSB-Ausbildung gemacht und den Lebensintegrationsprozess kennengelernt. Ich will Menschen begleiten, die da stehen, wo ich damals stand - ohne ihnen irgendwas zu verkaufen.",
      documents: {
        create: [
          { kind: "AUSWEIS", fileId: ausweis.id },
          { kind: "GEWERBESCHEIN", fileId: gewerbeschein.id },
        ],
      },
    },
  });

  console.log("Seed fertig. Accounts:");
  console.log(`  Admin:      admin@lost-plattform.at / ${PASSWORDS.admin}`);
  console.log(`  Berater:in: mira@lost-plattform.at / ${PASSWORDS.advisor} (+ jonas, leyla, david, sofia, elias)`);
  console.log(`  Klient:in:  kim@example.com / ${PASSWORDS.client}`);
  console.log(`  Klient:in:  noah@example.com / ${PASSWORDS.client} (offene Bewerbung)`);
  console.log(`  Admin-User-Id: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
