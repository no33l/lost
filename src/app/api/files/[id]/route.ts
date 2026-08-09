import type { NextRequest } from "next/server";
import type { StoredFile } from "@prisma/client";
import {
  getCurrentSession,
  hasRequiredTwoFactor,
  isSessionTwoFactorOk,
  type Auth,
} from "@/lib/session";
import { readStoredFile } from "@/lib/storage";
import { ROLES } from "@/lib/rbac";

// Einzige Auslieferungsstelle für hochgeladene Dateien.
// Zugriffsregeln pro Datei-Art:
//  - PROFILE_PHOTO:    alle eingeloggten Nutzer:innen (Berater-Verzeichnis)
//  - ADVISOR_LOGO:     Eigentümer:in oder Admin
//  - APPLICATION_DOC:  Eigentümer:in oder Admin MIT aktivierter 2FA (harte Bedingung)

function canAccess(auth: Auth, file: StoredFile): boolean {
  if (file.ownerId === auth.user.id) return true;
  switch (file.kind) {
    case "PROFILE_PHOTO":
      return true;
    case "ADVISOR_LOGO":
      return auth.user.role === ROLES.ADMIN;
    case "APPLICATION_DOC":
      return auth.user.role === ROLES.ADMIN && hasRequiredTwoFactor(auth.user);
    default:
      return false;
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getCurrentSession();
  if (!auth) return new Response("Nicht angemeldet.", { status: 401 });
  if (!isSessionTwoFactorOk(auth)) {
    return new Response("Zwei-Faktor-Bestätigung ausstehend.", { status: 401 });
  }

  const stored = await readStoredFile(id).catch(() => null);
  if (!stored) return new Response("Datei nicht gefunden.", { status: 404 });
  if (!canAccess(auth, stored.record)) {
    return new Response("Kein Zugriff auf diese Datei.", { status: 403 });
  }

  const asciiName = stored.record.fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return new Response(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": stored.record.mimeType,
      "Content-Length": String(stored.data.length),
      "Content-Disposition": `inline; filename="${asciiName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
