"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/berater", label: "Berater" },
  { href: "/events", label: "Events" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Header({ authed }: { authed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Lost. - Startseite" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-ink/5 text-ink" : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {authed ? (
            <ButtonLink href="/plattform" size="sm">
              Zur Plattform
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Login
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Registrieren
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          className="rounded-full p-2 text-ink hover:bg-ink/5 md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav
          aria-label="Mobile Navigation"
          className="border-t border-line/70 bg-paper px-4 pb-6 pt-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium",
                  pathname.startsWith(link.href) ? "bg-ink/5 text-ink" : "text-ink-soft hover:bg-ink/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {authed ? (
              <ButtonLink href="/plattform" onClick={() => setOpen(false)}>
                Zur Plattform
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/register" onClick={() => setOpen(false)}>
                  Registrieren
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" onClick={() => setOpen(false)}>
                  Login
                </ButtonLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
