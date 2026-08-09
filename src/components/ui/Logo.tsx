import { cn } from "@/lib/utils";

/** Wortmarke - das eine Wort, das alles trägt. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl font-semibold tracking-tight text-ink", className)}>
      Lost<span className="text-coral">.</span>
    </span>
  );
}
