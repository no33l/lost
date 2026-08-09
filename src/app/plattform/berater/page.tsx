import { redirect } from "next/navigation";
import { Compass } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { AdvisorMosaic } from "@/components/platform/AdvisorMosaic";
import { EmptyState } from "@/components/ui/EmptyState";

// Fisher-Yates: die Reihenfolge ist bei jedem Aufruf neu - es gibt kein Ranking.
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = result[i]!;
    result[i] = result[j]!;
    result[j] = a;
  }
  return result;
}

export default async function BeraterVerzeichnisPage() {
  const { user } = await requireUser();
  // Berater:innen stöbern nicht im Verzeichnis der anderen - Klient:innen (und Admins) schon.
  if (user.role === ROLES.ADVISOR) redirect("/plattform");

  const profiles = shuffle(await db.advisorProfile.findMany({ where: { published: true } }));

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-balance text-ink sm:text-4xl">
          Kein Ranking. Keine Titel. Nur Menschen.
        </h1>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Alle hier waren selbst mal zwischen den Welten. Die Reihenfolge ist zufällig und bei jedem
          Besuch neu - such dir die Person aus, die sich richtig anfühlt.
        </p>
        <p className="mt-3 text-sm text-ink-faint">
          Dein Erstkontakt ist unverbindlich und vertraulich. Die Plattform liest nicht mit.
        </p>
      </header>

      {profiles.length === 0 ? (
        <EmptyState
          icon={<Compass />}
          title="Gerade ist niemand sichtbar."
          description="Die ersten Berater:innen richten ihre Profile noch ein. Schau bald wieder vorbei - es lohnt sich."
        />
      ) : (
        <AdvisorMosaic profiles={profiles} />
      )}
    </div>
  );
}
