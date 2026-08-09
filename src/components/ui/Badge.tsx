import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "coral" | "pine" | "lilac" | "amber" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-ink/8 text-ink-soft",
  coral: "bg-coral-soft text-coral",
  pine: "bg-pine-soft text-pine",
  lilac: "bg-lilac-soft text-lilac",
  amber: "bg-amber-soft text-amber",
  danger: "bg-danger-soft text-danger",
};

type BadgeProps = ComponentProps<"span"> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
