import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Kleine Overline über dem Titel, z. B. „Wie es funktioniert". */
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  /** Für Sektionen auf bg-night. */
  dark?: boolean;
  /** Semantische Ebene - auf Unterseiten ist die erste Heading ein h1. */
  as?: "h1" | "h2";
  className?: string;
};

/** Einheitlicher Sektionskopf der öffentlichen Website: Overline, Display-Titel, Lead. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  dark = false,
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.22em]",
            dark ? "text-coral-bright" : "text-coral"
          )}
        >
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          "font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-[2.75rem] md:leading-[1.08]",
          eyebrow && "mt-3",
          dark ? "text-paper" : "text-ink"
        )}
      >
        {title}
      </Heading>
      {lead && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            dark ? "text-paper/70" : "text-ink-soft"
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
