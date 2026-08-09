"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Schwebende Collage der Berater:innen-Portraits.
 * Sechs Slots, acht Gesichter - alle paar Sekunden wechselt ein zufälliger Slot
 * per Crossfade auf ein gerade nicht sichtbares Gesicht, sodass mit der Zeit
 * alle acht auftauchen. Bei prefers-reduced-motion bleibt die Collage statisch
 * (das Schweben deaktiviert globals.css ohnehin).
 */

const FACES = [
  "mira",
  "jonas",
  "leyla",
  "david",
  "sofia",
  "elias",
  "gast1",
  "gast2",
].map((name) => `/berater/${name}.svg`);

type Slot = {
  /** Position, Breite und Grundrotation innerhalb des Collage-Rahmens. */
  wrapper: string;
  float: "float-a" | "float-b" | "float-c";
};

const SLOTS: Slot[] = [
  { wrapper: "left-[2%] top-[4%] w-[24%] -rotate-6", float: "float-a" },
  { wrapper: "left-[19%] top-[46%] w-[26%] rotate-2", float: "float-b" },
  { wrapper: "left-[40%] top-[10%] w-[24%] rotate-3", float: "float-c" },
  { wrapper: "left-[58%] top-[48%] w-[23%] -rotate-3", float: "float-a" },
  { wrapper: "left-[76%] top-[14%] w-[22%] rotate-6", float: "float-b" },
  { wrapper: "left-[83%] top-[60%] w-[15%] -rotate-2", float: "float-c" },
];

const SWAP_INTERVAL_MS = 4200;

export function FaceCollage({ className }: { className?: string }) {
  // Deterministische Startbelegung (kein Hydration-Mismatch), danach zufällige Wechsel.
  const [assignment, setAssignment] = useState<number[]>(() => SLOTS.map((_, index) => index));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setAssignment((prev) => {
        const inUse = new Set(prev);
        const free = FACES.map((_, index) => index).filter((index) => !inUse.has(index));
        if (free.length === 0) return prev;
        const slot = Math.floor(Math.random() * prev.length);
        const face = free[Math.floor(Math.random() * free.length)]!;
        const next = [...prev];
        next[slot] = face;
        return next;
      });
    }, SWAP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none relative aspect-[7/5] w-full select-none", className)}
    >
      {SLOTS.map((slot, slotIndex) => (
        <div key={slot.wrapper} className={cn("absolute", slot.wrapper)}>
          <div
            className={cn(
              "relative aspect-[10/13] w-full overflow-hidden rounded-2xl shadow-lg shadow-ink/15 ring-1 ring-white/70",
              slot.float
            )}
          >
            {FACES.map((src, faceIndex) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out",
                  assignment[slotIndex] === faceIndex ? "opacity-100" : "opacity-0"
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
