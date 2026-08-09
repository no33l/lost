import { cn } from "@/lib/utils";
import { initials, stableHash } from "@/lib/utils";

const palettes = [
  "bg-coral-soft text-coral",
  "bg-pine-soft text-pine",
  "bg-lilac-soft text-lilac",
  "bg-amber-soft text-amber",
];

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-24 text-2xl",
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      // Plain <img>: Quellen sind lokale SVG-Portraits oder /api/files/* (auth-geschützt).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }
  const palette = palettes[stableHash(name) % palettes.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full font-display font-semibold",
        palette,
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
