import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card p-6 shadow-[0_1px_3px_rgba(38,34,28,0.05)]",
        className
      )}
      {...props}
    />
  );
}
