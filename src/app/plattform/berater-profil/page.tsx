import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { hasRequiredTwoFactor, requireRole } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { FILE_KINDS, uploadHint } from "@/lib/storage";
import { Alert } from "@/components/ui/Alert";
import { AdvisorProfileForm } from "./AdvisorProfileForm";

export const metadata: Metadata = { title: "Mein Berater-Profil" };

// Bewusst nur requireRole (ohne 2FA-Zwang): Das Profil soll direkt nach der
// Freigabe angelegt werden können. Sensible Bereiche sind separat geschützt.
export default async function BeraterProfilPage() {
  const { user } = await requireRole(ROLES.ADVISOR);
  const profile = await db.advisorProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Mein Berater-Profil
        </h1>
        <p className="max-w-2xl leading-relaxed text-ink-soft">
          So sehen dich Klient:innen in der Berater-Übersicht. Zeig dich, wie du bist - das hier
          ist kein Hochglanz-Prospekt.
        </p>
      </header>

      {profile?.published ? (
        <Alert tone="success">Dein Profil ist für Klient:innen sichtbar.</Alert>
      ) : (
        <Alert tone="warn">
          Noch nicht veröffentlicht - Klient:innen sehen dich erst nach dem Freischalten.
        </Alert>
      )}

      {!hasRequiredTwoFactor(user) && (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-faint">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Für Kund:innenliste und Rechnungen brauchst du Zwei-Faktor-Authentifizierung.{" "}
            <Link
              href="/plattform/sicherheit?grund=pflicht"
              className="font-medium text-coral underline-offset-2 hover:underline"
            >
              Jetzt einrichten
            </Link>
          </span>
        </p>
      )}

      <AdvisorProfileForm
        photoHint={uploadHint(FILE_KINDS.PROFILE_PHOTO)}
        initial={
          profile
            ? {
                firstName: profile.firstName,
                lastName: profile.lastName,
                age: profile.age,
                languages: profile.languages,
                bio: profile.bio,
                photoUrl: profile.photoUrl,
                published: profile.published,
              }
            : null
        }
      />
    </div>
  );
}
