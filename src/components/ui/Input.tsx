import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const fieldStyles =
  "w-full rounded-xl border border-line bg-card px-4 text-ink placeholder:text-ink-faint transition-colors focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldStyles, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldStyles, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldStyles, "h-11 appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  );
}
