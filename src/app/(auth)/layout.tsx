import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* weiche Farbflächen im Hintergrund */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-coral-soft blur-3xl" />
        <div className="absolute top-1/3 -right-32 size-96 rounded-full bg-lilac-soft blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-pine-soft blur-3xl" />
      </div>

      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link href="/" aria-label="Zur Startseite">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="pb-8 text-center text-xs text-ink-faint">
        Vertraulich. Ohne Wartezimmer. -{" "}
        <Link href="/datenschutz" className="underline-offset-2 hover:underline">
          Datenschutz
        </Link>
      </footer>
    </div>
  );
}
