import { headers } from "next/headers";

// Einfaches In-Memory-Fixed-Window-Limit. Reicht für Single-Instance-Betrieb;
// bei horizontaler Skalierung durch einen Redis-basierten Limiter ersetzen.

type Bucket = { count: number; resetAt: number };

const store: Map<string, Bucket> = ((globalThis as Record<string, unknown>).__lostRateLimit ??=
  new Map<string, Bucket>()) as Map<string, Bucket>;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Bequemer Helfer für Auth-Actions: limitiert pro IP und Aktion. */
export async function checkAuthRateLimit(
  action: string,
  limit = 10,
  windowMs = 15 * 60_000
): Promise<string | null> {
  const ip = await clientIp();
  const result = rateLimit(`${action}:${ip}`, limit, windowMs);
  if (!result.ok) {
    const minutes = Math.max(1, Math.ceil(result.retryAfterSec / 60));
    return `Zu viele Versuche. Bitte warte ca. ${minutes} Minute${minutes === 1 ? "" : "n"}.`;
  }
  return null;
}
