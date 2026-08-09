"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Verzögerung in ms - für gestaffelte Sequenzen. */
  delay?: number;
};

/**
 * Blendet Inhalte sanft ein, sobald sie in den Viewport scrollen.
 * Progressive Enhancement: Serverseitig ist alles sichtbar (kein JS, Crawler,
 * Screenshots). Erst clientseitig wird versteckt, was noch unterhalb des
 * Viewports liegt - und beim Scrollen wieder eingeblendet.
 */
export function Reveal({ children, className, delay }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Nur Inhalte animieren, die beim Laden noch (fast) komplett unterhalb
    // der sichtbaren Fläche liegen - alles andere bleibt einfach stehen.
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;

    element.classList.add("reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
