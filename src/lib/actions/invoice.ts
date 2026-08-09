"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSensitive } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import {
  errorState,
  fromZodError,
  successState,
  type ActionState,
} from "@/lib/action-state";
import { FILE_KINDS, deleteStoredFile, saveUploadedFile } from "@/lib/storage";

// Server Actions rund ums Rechnungswesen. Beide Actions stehen hinter
// assertSensitive(ADVISOR) - Rechnungen sind eine sensible Funktion und
// setzen aktivierte 2FA voraus (harte serverseitige Bedingung).

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Etwas ist schiefgelaufen.";
}

/** "80,50" | "80.5" | "" → Cent oder null. Wirft nie, liefert NaN bei Unsinn. */
function euroToCents(raw: string): number | null {
  const value = raw.trim().replace(",", ".");
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return Math.round(parsed * 100);
}

/** "2026-07-18" → Date auf 12:00 UTC (zeigt in jeder Zeitzone denselben Kalendertag). */
function dateFromInput(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

// ---------------------------------------------------------------------------
// Vorlage & Logo
// ---------------------------------------------------------------------------

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : null));

const settingsSchema = z.object({
  businessName: optionalText(120, "Maximal 120 Zeichen."),
  addressLine1: optionalText(120, "Maximal 120 Zeichen."),
  addressLine2: optionalText(120, "Maximal 120 Zeichen."),
  vatId: optionalText(30, "Maximal 30 Zeichen."),
  iban: z
    .string()
    .optional()
    .transform((value) => (value ?? "").replace(/\s+/g, "").toUpperCase())
    .refine((value) => value === "" || /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(value), {
      message: "Das sieht noch nicht nach einer IBAN aus (Ländercode + insgesamt 15-34 Stellen).",
    })
    .transform((value) => (value === "" ? null : value)),
  defaultService: optionalText(200, "Maximal 200 Zeichen."),
  defaultUnitPrice: z
    .string()
    .optional()
    .transform((value) => euroToCents(value ?? ""))
    .refine((cents) => cents === null || (Number.isInteger(cents) && cents >= 0 && cents <= 10_000_000), {
      message: "Bitte gib einen Betrag zwischen 0 und 100.000 Euro an.",
    }),
  footerText: optionalText(400, "Maximal 400 Zeichen."),
});

export async function saveInvoiceSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string;
  try {
    const auth = await assertSensitive(ROLES.ADVISOR);
    userId = auth.user.id;
  } catch (error) {
    return errorState(errorMessage(error));
  }

  const parsed = settingsSchema.safeParse({
    businessName: formData.get("businessName") ?? undefined,
    addressLine1: formData.get("addressLine1") ?? undefined,
    addressLine2: formData.get("addressLine2") ?? undefined,
    vatId: formData.get("vatId") ?? undefined,
    iban: formData.get("iban") ?? undefined,
    defaultService: formData.get("defaultService") ?? undefined,
    defaultUnitPrice: formData.get("defaultUnitPrice") ?? undefined,
    footerText: formData.get("footerText") ?? undefined,
  });
  if (!parsed.success) return fromZodError(parsed.error);

  // Neues Logo (optional) speichern, bevor die Einstellungen geschrieben werden.
  const logo = formData.get("logo");
  let newLogoId: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    try {
      const stored = await saveUploadedFile(logo, {
        ownerId: userId,
        kind: FILE_KINDS.ADVISOR_LOGO,
      });
      newLogoId = stored.id;
    } catch (error) {
      return errorState(errorMessage(error), { logo: [errorMessage(error)] });
    }
  }

  try {
    const existing = await db.invoiceSettings.findUnique({ where: { advisorId: userId } });
    const data = {
      ...parsed.data,
      ...(newLogoId ? { logoFileId: newLogoId } : {}),
    };
    await db.invoiceSettings.upsert({
      where: { advisorId: userId },
      create: { advisorId: userId, ...data },
      update: data,
    });
    // Altes Logo erst nach erfolgreichem Speichern aufräumen.
    if (newLogoId && existing?.logoFileId && existing.logoFileId !== newLogoId) {
      await deleteStoredFile(existing.logoFileId);
    }
  } catch {
    if (newLogoId) await deleteStoredFile(newLogoId).catch(() => {});
    return errorState("Speichern hat nicht geklappt. Versuch es bitte noch einmal.");
  }

  revalidatePath("/plattform/rechnungen/einstellungen");
  revalidatePath("/plattform/rechnungen");
  return successState("Gespeichert. Deine nächste Rechnung nutzt diese Vorlage.");
}

// ---------------------------------------------------------------------------
// Rechnung ausstellen
// ---------------------------------------------------------------------------

const invoiceItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Beschreibung fehlt.")
    .max(300, "Maximal 300 Zeichen pro Position."),
  quantity: z.coerce
    .number({ invalid_type_error: "Menge fehlt." })
    .int("Nur ganze Mengen.")
    .min(1, "Menge mindestens 1.")
    .max(999, "Menge maximal 999."),
  unitPriceCents: z
    .number({ required_error: "Preis fehlt.", invalid_type_error: "Preis fehlt." })
    .refine((cents) => Number.isInteger(cents) && cents >= 0 && cents <= 10_000_000, {
      message: "Bitte gib einen Einzelpreis zwischen 0 und 100.000 Euro an.",
    }),
});

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Bitte wähle aus, wer die Rechnung bekommt."),
  recipient: optionalText(120, "Maximal 120 Zeichen."),
  serviceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte gib ein Leistungsdatum an."),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte gib an, bis wann die Rechnung fällig ist."),
  note: optionalText(500, "Maximal 500 Zeichen."),
  items: z
    .array(invoiceItemSchema)
    .min(1, "Mindestens eine Position.")
    .max(25, "Maximal 25 Positionen."),
});

export async function createInvoice(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let advisorId: string;
  try {
    const auth = await assertSensitive(ROLES.ADVISOR);
    advisorId = auth.user.id;
  } catch (error) {
    return errorState(errorMessage(error));
  }

  const descriptions = formData.getAll("itemDescription").map(String);
  const quantities = formData.getAll("itemQuantity").map(String);
  const unitPrices = formData.getAll("itemUnitPrice").map(String);
  const items = descriptions.map((description, index) => ({
    description,
    quantity: quantities[index] ?? "",
    unitPriceCents: euroToCents(unitPrices[index] ?? ""),
  }));

  const parsed = createInvoiceSchema.safeParse({
    clientId: formData.get("clientId") ?? "",
    recipient: formData.get("recipient") ?? undefined,
    serviceDate: formData.get("serviceDate") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    note: formData.get("note") ?? undefined,
    items,
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const input = parsed.data;

  // Geschäftsregel 1 (hart, serverseitig): Rechnungen nur an Personen aus der
  // eigenen Kund:innenliste - also nur, wenn diese Klient:in in einer
  // ADVISORY-Unterhaltung mit mir bereits selbst geschrieben hat.
  const relationship = await db.conversation.findFirst({
    where: {
      advisorId,
      clientId: input.clientId,
      kind: "ADVISORY",
      clientHasMessaged: true,
    },
  });
  if (!relationship) {
    return errorState("Du kannst nur Personen aus deiner Kund:innenliste eine Rechnung stellen.");
  }

  let invoiceId: string;
  try {
    const invoice = await db.$transaction(async (tx) => {
      // Vorlage lesen (anlegen, falls noch keine existiert) - dort lebt die
      // fortlaufende Rechnungsnummer.
      const settings = await tx.invoiceSettings.upsert({
        where: { advisorId },
        create: { advisorId },
        update: {},
      });
      const year = new Date().getFullYear();
      const number = `${year}-${String(settings.nextInvoiceNumber).padStart(4, "0")}`;
      await tx.invoiceSettings.update({
        where: { advisorId },
        data: { nextInvoiceNumber: { increment: 1 } },
      });
      const totalCents = input.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceCents,
        0
      );
      return tx.invoice.create({
        data: {
          number,
          advisorId,
          clientId: input.clientId,
          recipient: input.recipient,
          serviceDate: dateFromInput(input.serviceDate),
          dueAt: dateFromInput(input.dueDate),
          note: input.note,
          totalCents,
          items: {
            create: input.items.map((item, index) => ({
              position: index + 1,
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
            })),
          },
        },
      });
    });
    invoiceId = invoice.id;
  } catch {
    return errorState("Die Rechnung konnte nicht angelegt werden. Versuch es bitte noch einmal.");
  }

  revalidatePath("/plattform/rechnungen");
  redirect(`/plattform/rechnungen/${invoiceId}`);
}
