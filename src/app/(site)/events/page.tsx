import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Treffen, Gespräche und Abende von Lost. - in Wien und online. Echte Begegnung statt Pflichttermine.",
};

type EventRecord = {
  id: string;
  title: string;
  date: Date;
  location: string;
  description: string;
};

function EventCard({ event, past = false }: { event: EventRecord; past?: boolean }) {
  const day = event.date.getDate();
  const month = new Intl.DateTimeFormat("de-AT", { month: "short" }).format(event.date);

  return (
    <article
      className={cn(
        "flex gap-5 rounded-2xl border border-line bg-card p-6 shadow-[0_1px_3px_rgba(38,34,28,0.05)]",
        past && "opacity-60"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex h-fit w-16 shrink-0 flex-col items-center rounded-xl px-2 py-3",
          past ? "bg-ink/5 text-ink-soft" : "bg-coral-soft text-coral"
        )}
      >
        <span className="font-display text-2xl font-semibold leading-none">{day}</span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-wide">{month}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
            {event.title}
          </h3>
          {past && <Badge tone="neutral">Vorbei</Badge>}
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {formatDate(event.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {formatTime(event.date)} Uhr
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {event.location}
          </span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-[0.95rem]">
          {event.description}
        </p>
      </div>
    </article>
  );
}

export default async function EventsPage() {
  const events = await db.event.findMany({ orderBy: { date: "asc" } });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcoming = events.filter((event) => event.date >= startOfToday);
  // Vergangene: jüngste zuerst.
  const past = events.filter((event) => event.date < startOfToday).reverse();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
      <Reveal>
        <SectionHeading
          as="h1"
          eyebrow="Events"
          title="Manchmal hilft ein Raum mit echten Menschen."
          lead="Abende, Treffen und Gespräche von Lost. - in Wien und online. Kein Pflichtprogramm: Du kommst, wenn es passt, und gehst, wann du willst."
        />
      </Reveal>

      {events.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<CalendarDays aria-hidden />}
            title="Gerade ist nichts geplant."
            description="Events entstehen hier, wenn sie entstehen - echte Treffen statt Terminpflicht. Schau einfach wieder vorbei."
          />
        </div>
      ) : (
        <>
          <section aria-labelledby="events-kommende" className="mt-12">
            <h2
              id="events-kommende"
              className="text-xs font-semibold uppercase tracking-[0.22em] text-coral"
            >
              Kommende Events
            </h2>
            {upcoming.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  icon={<CalendarDays aria-hidden />}
                  title="Gerade ist nichts geplant."
                  description="Sobald das nächste Treffen steht, findest du es hier."
                />
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {upcoming.map((event, index) => (
                  <Reveal key={event.id} delay={index * 80}>
                    <EventCard event={event} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section aria-labelledby="events-vergangene" className="mt-16">
              <h2
                id="events-vergangene"
                className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-faint"
              >
                Vergangene Events
              </h2>
              <div className="mt-5 space-y-4">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} past />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
