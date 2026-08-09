import Link from "next/link";

const platformLinks = [
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/berater", label: "Berater" },
  { href: "/events", label: "Events" },
  { href: "/kontakt", label: "Kontakt" },
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
];

const socialLinks = ["TikTok", "Instagram", "Snapchat", "Facebook"];

export function Footer() {
  return (
    <footer className="bg-night text-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight">
              Lost<span className="text-coral-bright">.</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/60">
              Lebensberatung für Menschen zwischen den Welten. Ehrlich, auf Augenhöhe - online
              oder in Wien.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/80">
              Alle Beratungen sind vertraulich und finden privat zwischen dir und deiner
              Berater:in statt. Die Plattform liest nicht mit.
            </p>
          </div>
          <nav aria-label="Footer-Navigation">
            <p className="text-xs font-semibold uppercase tracking-widest text-paper/40">Plattform</p>
            <ul className="mt-4 space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper/70 transition-colors hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/register" className="text-sm text-paper/70 transition-colors hover:text-paper">
                  Registrieren
                </Link>
              </li>
            </ul>
          </nav>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-paper/40">Draußen</p>
            <ul className="mt-4 space-y-2.5">
              {socialLinks.map((name) => (
                <li key={name}>
                  <span className="text-sm text-paper/70">{name}</span>
                  <span className="ml-2 text-xs text-paper/40">bald</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-paper/10 pt-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Lost. - Wien</p>
          <div className="flex gap-5">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-paper">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
