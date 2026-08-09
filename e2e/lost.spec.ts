import { test, expect, type Page } from "@playwright/test";
import { authenticator } from "otplib";

// End-to-End-Smoke über alle Kern-Flows. Läuft seriell (ein Worker), weil
// spätere Tests auf den Zuständen der früheren aufbauen (Registrierung → Chat
// → Kund:innen-Beziehung → Rechnung). Vorher: npx prisma db seed.

test.describe.configure({ mode: "serial" });

const CLIENT_NAME = "TestKai";
const CLIENT_EMAIL = `testkai-${Date.now()}@example.com`;
const CLIENT_PW = "SuperGeheim!42";
const CHAT_TEXT = "Hallo Mira, ich bin neu hier und wollte einfach mal schreiben.";

let advisorTotpSecret = "";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: /anmelden|login|einloggen/i }).click();
}

async function setupTwoFactor(page: Page): Promise<string> {
  await page.goto("/plattform/sicherheit");
  await page.getByRole("button", { name: "2FA jetzt einrichten" }).click();
  const secretText = await page.getByTestId("totp-secret").textContent({ timeout: 15_000 });
  const secret = secretText!.trim();
  await page.fill("#twofactor-confirm-code", authenticator.generate(secret));
  await page.getByRole("button", { name: "2FA aktivieren" }).click();
  await expect(page.getByTestId("recovery-codes")).toBeVisible({ timeout: 15_000 });
  expect(await page.getByTestId("recovery-codes").locator("li").count()).toBe(8);
  return secret;
}

test("öffentliche Seiten rendern", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lost");
  await expect(page.getByText("zwischen den Welten").first()).toBeVisible();

  for (const path of ["/ueber-uns", "/berater", "/events", "/kontakt", "/impressum", "/datenschutz"]) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} sollte 200 liefern`).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  // Plattform ohne Login → Redirect auf /login
  await page.goto("/plattform");
  await page.waitForURL("**/login**");
});

test("Klient:in registriert sich, findet Mira und startet einen Chat", async ({ page }) => {
  await page.goto("/register");
  await page.fill('input[name="displayName"]', CLIENT_NAME);
  await page.fill('input[name="email"]', CLIENT_EMAIL);
  await page.fill('input[name="password"]', CLIENT_PW);
  await page.fill('input[name="passwordConfirm"]', CLIENT_PW);
  await page.getByRole("button", { name: /registrieren|konto|loslegen|starten/i }).click();
  await page.waitForURL("**/plattform");

  await page.goto("/plattform/berater");
  await page.locator('a[href^="/plattform/berater/"]', { hasText: "Mira" }).first().click();
  await page.waitForURL("**/plattform/berater/**");
  await expect(page.getByText("Mira Steiner")).toBeVisible();

  await page.getByRole("button", { name: "Nachricht schreiben" }).click();
  await page.waitForURL("**/plattform/chats/**");

  await page.fill('textarea[placeholder="Schreib eine Nachricht …"]', CHAT_TEXT);
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await expect(page.getByText(CHAT_TEXT)).toBeVisible({ timeout: 15_000 });
});

test("Berater:in: 2FA-Zwang greift, Setup funktioniert, Kund:innenliste zeigt neue Klient:in", async ({
  page,
}) => {
  await login(page, "mira@lost-plattform.at", "LostBerater!2026");
  await page.waitForURL("**/plattform");

  // Sensible Seite ohne 2FA → harter Redirect zur Einrichtung
  await page.goto("/plattform/kunden");
  await page.waitForURL("**/plattform/sicherheit**");

  advisorTotpSecret = await setupTwoFactor(page);

  await page.goto("/plattform/kunden");
  await expect(page).toHaveURL(/\/plattform\/kunden/);
  await expect(page.getByText(CLIENT_NAME).first()).toBeVisible();
  await expect(page.getByText("Kim").first()).toBeVisible();
});

test("Berater:in stellt Rechnung an neue Kund:in, PDF wird erzeugt", async ({ page }) => {
  await login(page, "mira@lost-plattform.at", "LostBerater!2026");
  await page.waitForURL("**/login/2fa");
  await page.fill('input[name="code"]', authenticator.generate(advisorTotpSecret));
  await page.getByRole("button", { name: /bestätigen|weiter|prüfen/i }).click();
  await page.waitForURL("**/plattform");

  await page.goto("/plattform/rechnungen/neu");
  await page.selectOption("#clientId", { label: CLIENT_NAME });
  await page
    .locator('input[placeholder="z. B. Lebensberatung, Einzelgespräch (60 Min)"]')
    .first()
    .fill("Lebensberatung, Einzelgespräch (60 Min)");
  await page.locator('input[placeholder="0,00"]').first().fill("80");
  await page.getByRole("button", { name: "Rechnung ausstellen" }).click();
  await page.waitForURL(/\/plattform\/rechnungen\/(?!neu)[a-z0-9]+/i);

  await expect(page.getByRole("heading", { name: /Rechnung \d{4}-\d{4}/ })).toBeVisible();
  await expect(page.getByText("80,00").first()).toBeVisible();

  const invoiceId = page.url().split("/").pop()!;
  const pdf = await page.request.get(`/api/invoices/${invoiceId}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  const body = await pdf.body();
  expect(body.subarray(0, 4).toString()).toBe("%PDF");
});

test("Klient:in sieht die Rechnung und kann das PDF laden", async ({ page }) => {
  await login(page, CLIENT_EMAIL, CLIENT_PW);
  await page.waitForURL("**/plattform");

  await page.goto("/plattform/rechnungen");
  await expect(page.getByText(/Mira/).first()).toBeVisible();
  await expect(page.getByText("80,00").first()).toBeVisible();

  const pdfLink = page.locator('a[href$="/pdf"]').first();
  const href = await pdfLink.getAttribute("href");
  const pdf = await page.request.get(href!);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
});

test("Admin: 2FA-Pflicht, Bewerbung einsehen, Dokument abrufen, Kontakt aufnehmen, annehmen", async ({
  page,
}) => {
  await login(page, "admin@lost-plattform.at", "LostAdmin!2026");
  await page.waitForURL("**/plattform");

  await page.goto("/plattform/admin/bewerbungen");
  await page.waitForURL("**/plattform/sicherheit**");
  await setupTwoFactor(page);

  await page.goto("/plattform/admin/bewerbungen");
  await page.getByRole("link", { name: /Noah/ }).first().click();
  await page.waitForURL("**/plattform/admin/bewerbungen/**");
  const detailUrl = page.url();

  await expect(page.getByText(/Ausweis/).first()).toBeVisible();
  await expect(page.getByText(/Gewerbeschein/).first()).toBeVisible();

  const docHref = await page.locator('a[href^="/api/files/"]').first().getAttribute("href");
  const doc = await page.request.get(docHref!);
  expect(doc.status(), "Bewerbungs-Dokument muss für Admin mit 2FA abrufbar sein").toBe(200);

  await page.getByRole("button", { name: /Kontakt/ }).click();
  await page.waitForURL("**/plattform/chats/**");
  await expect(page.getByText("Bewerbung").first()).toBeVisible();

  await page.goto(detailUrl);
  await page.getByRole("button", { name: /Annehmen/ }).click();
  await expect(page.getByText(/Angenommen/).first()).toBeVisible({ timeout: 15_000 });
});
