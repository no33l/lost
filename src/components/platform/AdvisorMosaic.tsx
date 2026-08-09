import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, parseLanguages } from "@/lib/utils";

export type AdvisorMosaicProfile = {
  id: string;
  firstName: string;
  age: number;
  languages: string;
  bio: string;
  photoUrl: string | null;
};

// Bewusst unregelmäßig: leichte Rotationen und unterschiedlich lange Bio-Auszüge
// lassen das Verzeichnis wie eine Pinnwand wirken - nicht wie eine Rangliste.
const rotations = [
  "rotate-[0.4deg]",
  "-rotate-[0.5deg]",
  "rotate-[0.2deg]",
  "-rotate-[0.3deg]",
  "rotate-[0.6deg]",
  "-rotate-[0.2deg]",
];

const bioClamps = ["line-clamp-3", "line-clamp-5", "line-clamp-2", "line-clamp-4", "line-clamp-3", "line-clamp-6"];

const badgeTones = ["pine", "lilac", "amber", "coral"] as const;

export function AdvisorMosaic({ profiles }: { profiles: AdvisorMosaicProfile[] }) {
  return (
    <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
      {profiles.map((profile, index) => {
        const languages = parseLanguages(profile.languages);
        const tone = badgeTones[index % badgeTones.length];
        return (
          <Link
            key={profile.id}
            href={`/plattform/berater/${profile.id}`}
            className={cn(
              "group mb-5 block break-inside-avoid rounded-3xl",
              rotations[index % rotations.length]
            )}
          >
            <article className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:-translate-y-1">
              {profile.photoUrl ? (
                // Plain <img>: lokale SVG-Portraits bzw. auth-geschützte /api/files/*-Quellen.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoUrl}
                  alt={`Portrait von ${profile.firstName}`}
                  loading="lazy"
                  className="aspect-[3/4] w-full max-w-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="flex aspect-[3/4] w-full items-center justify-center bg-paper-soft"
                >
                  <span className="font-display text-6xl font-semibold text-ink-faint">
                    {profile.firstName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold text-ink">
                  {profile.firstName}, {profile.age}
                </h3>
                {languages.length > 0 && (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Sprachen">
                    {languages.map((language) => (
                      <li key={language}>
                        <Badge tone={tone}>{language}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <p
                  className={cn(
                    "mt-3 text-sm leading-relaxed text-ink-soft",
                    bioClamps[index % bioClamps.length]
                  )}
                >
                  {profile.bio}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-coral">
                  Kennenlernen
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
