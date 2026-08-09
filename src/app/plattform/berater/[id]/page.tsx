import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ROLES } from "@/lib/rbac";
import { parseLanguages } from "@/lib/utils";
import { startConversation } from "@/lib/actions/chat";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type PageProps = { params: Promise<{ id: string }> };

export default async function BeraterDetailPage({ params }: PageProps) {
  const { user } = await requireUser();
  // Wie das Verzeichnis: nur Klient:innen und Admins.
  if (user.role === ROLES.ADVISOR) redirect("/plattform");

  const { id } = await params;
  const profile = await db.advisorProfile.findUnique({ where: { id } });
  if (!profile || !profile.published) notFound();

  const languages = parseLanguages(profile.languages);

  return (
    <div className="space-y-6">
      <Link
        href="/plattform/berater"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Zurück zu allen Berater:innen
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        {/* Portrait - auf Desktop bleibt es beim Scrollen stehen */}
        <div>
          <div className="lg:sticky lg:top-10">
            {profile.photoUrl ? (
              // Plain <img>: lokale SVG-Portraits bzw. auth-geschützte /api/files/*-Quellen.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt={`Portrait von ${profile.firstName} ${profile.lastName}`}
                className="aspect-[3/4] w-full max-w-full rounded-3xl border border-line object-cover shadow-sm"
              />
            ) : (
              <div
                aria-hidden
                className="flex aspect-[3/4] w-full items-center justify-center rounded-3xl border border-line bg-paper-soft"
              >
                <span className="font-display text-7xl font-semibold text-ink-faint">
                  {profile.firstName.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <header>
            <h1 className="font-display text-3xl font-semibold text-balance text-ink sm:text-4xl">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="mt-2 text-ink-soft">{profile.age} Jahre</p>
            {languages.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Sprachen">
                {languages.map((language) => (
                  <li key={language}>
                    <Badge tone="pine">{language}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </header>

          <div className="max-w-prose text-[1.02rem] leading-relaxed whitespace-pre-line text-ink-soft">
            {profile.bio}
          </div>

          <Alert tone="success" title="Unverbindlich und vertraulich.">
            Dein Erstkontakt ist unverbindlich und vertraulich. Kein Name nötig - du entscheidest,
            was du erzählst. Die Plattform liest nicht mit.
          </Alert>

          {user.role === ROLES.CLIENT && (
            <div>
              <form action={startConversation.bind(null, profile.userId)}>
                <Button type="submit" size="lg">
                  <MessageCircle className="size-5" aria-hidden />
                  Nachricht schreiben
                </Button>
              </form>
              <p className="mt-3 text-sm text-ink-faint">
                Du landest direkt im privaten Chat mit {profile.firstName}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
