import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warn" | "error";

const tones: Record<Tone, string> = {
  info: "border-lilac/30 bg-lilac-soft text-ink",
  success: "border-pine/30 bg-pine-soft text-ink",
  warn: "border-amber-bright/40 bg-amber-soft text-ink",
  error: "border-danger/30 bg-danger-soft text-ink",
};

const dots: Record<Tone, string> = {
  info: "bg-lilac",
  success: "bg-pine",
  warn: "bg-amber-bright",
  error: "bg-danger",
};

type AlertProps = {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  return (
    <div role="status" className={cn("rounded-xl border p-4 text-sm leading-relaxed", tones[tone], className)}>
      <div className="flex gap-3">
        <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", dots[tone])} />
        <div>
          {title && <p className="font-semibold">{title}</p>}
          <div className={cn(title && "mt-0.5", "text-ink-soft")}>{children}</div>
        </div>
      </div>
    </div>
  );
}
