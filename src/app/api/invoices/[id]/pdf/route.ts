import type { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { db } from "@/lib/db";
import { getCurrentSession, hasRequiredTwoFactor, isSessionTwoFactorOk } from "@/lib/session";
import { readStoredFile } from "@/lib/storage";

// Serverseitige PDF-Erzeugung der Rechnung (pdfkit). Zugriff wie die
// Detailseite: nur ausstellende Berater:in (mit 2FA) oder empfangende Klient:in.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// WinAnsi-sicheres Geldformat (kein Intl - das liefert geschützte Leerzeichen,
// die Helvetica im PDF nicht kennt).
function euro(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " EUR";
}

function datum(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${date.getFullYear()}`;
}

const INK = "#26221c";
const SOFT = "#675f51";
const FAINT = "#9b9184";
const LINE = "#e7decf";
const PAPER_SOFT = "#f4ecdf";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentSession();
  if (!auth) return new Response("Nicht angemeldet.", { status: 401 });
  if (!isSessionTwoFactorOk(auth)) {
    return new Response("Zwei-Faktor-Bestätigung ausstehend.", { status: 401 });
  }

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { position: "asc" } },
      advisor: { include: { advisorProfile: true, invoiceSettings: true } },
      client: true,
    },
  });
  if (!invoice) return new Response("Rechnung nicht gefunden.", { status: 404 });

  const isAdvisor = invoice.advisorId === auth.user.id;
  const isClient = invoice.clientId === auth.user.id;
  if (!isAdvisor && !isClient) return new Response("Kein Zugriff.", { status: 403 });
  if (isAdvisor && !hasRequiredTwoFactor(auth.user)) {
    return new Response("Diese Funktion erfordert aktivierte Zwei-Faktor-Authentifizierung.", {
      status: 403,
    });
  }

  const settings = invoice.advisor.invoiceSettings;
  const profile = invoice.advisor.advisorProfile;
  const advisorName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : invoice.advisor.displayName;
  const senderName = settings?.businessName || advisorName;
  const recipientName = invoice.recipient || invoice.client.displayName;

  let logo: Buffer | null = null;
  if (settings?.logoFileId) {
    try {
      const stored = await readStoredFile(settings.logoFileId);
      if (stored) logo = stored.data;
    } catch {
      logo = null;
    }
  }

  const doc = new PDFDocument({ size: "A4", margin: 56, info: { Title: `Rechnung ${invoice.number}` } });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk as Buffer));
  const finished = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const left = 56;
  const right = doc.page.width - 56; // 539

  // Kopf: Absender links, Logo (oder Name) rechts
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(senderName, left, 56);
  doc.font("Helvetica").fontSize(9).fillColor(SOFT);
  if (settings?.addressLine1) doc.text(settings.addressLine1);
  if (settings?.addressLine2) doc.text(settings.addressLine2);
  if (settings?.vatId) doc.text(`UID: ${settings.vatId}`);

  if (logo) {
    try {
      doc.image(logo, right - 140, 50, { fit: [140, 60], align: "right" });
    } catch {
      // defektes Bild - Rechnung trotzdem erzeugen
    }
  } else {
    doc.font("Helvetica-Bold").fontSize(14).fillColor(INK);
    doc.text(senderName, right - 220, 56, { width: 220, align: "right" });
  }

  // Titel
  let y = 150;
  doc.font("Helvetica-Bold").fontSize(20).fillColor(INK).text(`Rechnung ${invoice.number}`, left, y);
  y += 40;

  // Empfänger links, Meta rechts
  doc.font("Helvetica").fontSize(8).fillColor(FAINT).text("RECHNUNG AN", left, y);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(recipientName, left, y + 12);

  const meta: Array<[string, string]> = [["Rechnungsdatum", datum(invoice.issuedAt)]];
  if (invoice.serviceDate) meta.push(["Leistungsdatum", datum(invoice.serviceDate)]);
  if (invoice.dueAt) meta.push(["Zahlbar bis", datum(invoice.dueAt)]);
  let metaY = y;
  for (const [label, value] of meta) {
    doc.font("Helvetica").fontSize(9).fillColor(FAINT).text(label, 330, metaY, { width: 110 });
    doc.font("Helvetica").fontSize(9).fillColor(INK).text(value, 440, metaY, { width: right - 440, align: "right" });
    metaY += 14;
  }
  y = Math.max(y + 40, metaY + 14);

  // Positionstabelle
  const col = {
    pos: { x: left + 4, w: 26 },
    desc: { x: left + 34, w: 236 },
    qty: { x: 330, w: 44 },
    unit: { x: 380, w: 72 },
    total: { x: 458, w: right - 462 },
  };

  doc.rect(left, y, right - left, 20).fill(PAPER_SOFT);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(SOFT);
  const headY = y + 6;
  doc.text("POS", col.pos.x, headY, { width: col.pos.w });
  doc.text("BESCHREIBUNG", col.desc.x, headY, { width: col.desc.w });
  doc.text("MENGE", col.qty.x, headY, { width: col.qty.w, align: "right" });
  doc.text("EINZELPREIS", col.unit.x, headY, { width: col.unit.w, align: "right" });
  doc.text("GESAMT", col.total.x, headY, { width: col.total.w, align: "right" });
  y += 28;

  doc.font("Helvetica").fontSize(9);
  for (const item of invoice.items) {
    const rowHeight = Math.max(
      12,
      doc.heightOfString(item.description, { width: col.desc.w })
    );
    if (y + rowHeight > 750) {
      doc.addPage();
      y = 56;
    }
    doc.fillColor(FAINT).text(String(item.position), col.pos.x, y, { width: col.pos.w });
    doc.fillColor(INK).text(item.description, col.desc.x, y, { width: col.desc.w });
    doc.fillColor(INK).text(String(item.quantity), col.qty.x, y, { width: col.qty.w, align: "right" });
    doc.fillColor(INK).text(euro(item.unitPriceCents), col.unit.x, y, { width: col.unit.w, align: "right" });
    doc
      .fillColor(INK)
      .text(euro(item.quantity * item.unitPriceCents), col.total.x, y, {
        width: col.total.w,
        align: "right",
      });
    y += rowHeight + 6;
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .lineWidth(0.5)
      .strokeColor(LINE)
      .stroke();
    y += 8;
  }

  // Summe
  y += 4;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
  doc.text("Gesamtbetrag", col.qty.x - 60, y, { width: 150, align: "right" });
  doc.fontSize(12).text(euro(invoice.totalCents), col.total.x - 30, y - 1, {
    width: col.total.w + 30,
    align: "right",
  });
  y += 34;

  // Zahlungs- und Zusatzinfos
  doc.font("Helvetica").fontSize(9).fillColor(SOFT);
  const infoWidth = right - left;
  if (!settings?.vatId) {
    doc.text("Kein USt-Ausweis (Kleinunternehmerregelung), sofern nicht anders angegeben.", left, y, {
      width: infoWidth,
    });
    y = doc.y + 6;
  }
  if (settings?.iban) {
    doc.text(`Bitte überweisen an: IBAN ${settings.iban}`, left, y, { width: infoWidth });
    y = doc.y + 6;
  }
  if (invoice.note) {
    doc.text(invoice.note, left, y, { width: infoWidth });
    y = doc.y + 6;
  }
  if (settings?.footerText) {
    y += 6;
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .lineWidth(0.5)
      .strokeColor(LINE)
      .stroke();
    doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(FAINT).text(settings.footerText, left, y + 10, {
      width: infoWidth,
    });
  }

  // Fußzeile
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(FAINT)
    .text("Erstellt über Lost. - lost-plattform.at · Beratung bleibt privat.", left, 790, {
      width: infoWidth,
      align: "center",
    });

  doc.end();
  const buffer = await finished;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rechnung-${invoice.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
