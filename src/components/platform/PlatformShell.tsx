"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarHeart,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { logoutAction } from "@/lib/actions/logout";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof icons;
  highlight?: boolean;
};

const icons = {
  dashboard: LayoutDashboard,
  users: Users,
  chat: MessageCircle,
  receipt: Receipt,
  user: UserRound,
  sparkles: Sparkles,
  inbox: Inbox,
  shield: ShieldCheck,
  calendar: CalendarHeart,
};

const navByRole: Record<Role, NavItem[]> = {
  CLIENT: [
    { href: "/plattform", label: "Übersicht", icon: "dashboard" },
    { href: "/plattform/berater", label: "Berater", icon: "users" },
    { href: "/plattform/chats", label: "Chats", icon: "chat" },
    { href: "/plattform/rechnungen", label: "Rechnungen", icon: "receipt" },
    { href: "/plattform/profil", label: "Konto", icon: "user" },
    { href: "/plattform/bewerbung", label: "Als Lebensberater:in bewerben", icon: "sparkles", highlight: true },
  ],
  ADVISOR: [
    { href: "/plattform", label: "Übersicht", icon: "dashboard" },
    { href: "/plattform/chats", label: "Chats", icon: "chat" },
    { href: "/plattform/kunden", label: "Kund:innen", icon: "users" },
    { href: "/plattform/rechnungen", label: "Rechnungen", icon: "receipt" },
    { href: "/plattform/berater-profil", label: "Mein Berater-Profil", icon: "sparkles" },
    { href: "/plattform/sicherheit", label: "Sicherheit", icon: "shield" },
    { href: "/plattform/profil", label: "Konto", icon: "user" },
  ],
  ADMIN: [
    { href: "/plattform", label: "Übersicht", icon: "dashboard" },
    { href: "/plattform/admin/bewerbungen", label: "Bewerbungen", icon: "inbox" },
    { href: "/plattform/admin/nutzer", label: "Nutzer:innen", icon: "users" },
    { href: "/plattform/chats", label: "Chats", icon: "chat" },
    { href: "/plattform/sicherheit", label: "Sicherheit", icon: "shield" },
    { href: "/plattform/profil", label: "Konto", icon: "user" },
  ],
};

type PlatformShellProps = {
  role: Role;
  displayName: string;
  email: string;
  children: ReactNode;
};

export function PlatformShell({ role, displayName, email, children }: PlatformShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navByRole[role];

  const nav = (
    <nav aria-label="Plattform-Navigation" className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/plattform" ? pathname === "/plattform" : pathname.startsWith(item.href);
        const Icon = icons[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-ink text-paper"
                : item.highlight
                  ? "bg-coral-soft text-coral hover:bg-coral hover:text-white"
                  : "text-ink-soft hover:bg-ink/5 hover:text-ink"
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            <span className="leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const userBlock = (
    <div className="border-t border-line pt-4">
      <div className="flex items-center gap-3 px-1">
        <Avatar name={displayName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
          <p className="truncate text-xs text-ink-faint">{ROLE_LABELS[role]}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Abmelden"
            aria-label="Abmelden"
            className="rounded-full p-2 text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
      <p className="mt-4 px-1 text-[11px] leading-relaxed text-ink-faint">
        Beratungen laufen privat zwischen dir und deiner Berater:in. Die Plattform liest nicht mit.
      </p>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Desktop-Sidebar */}
      <aside className="hidden border-r border-line bg-card lg:flex lg:flex-col lg:gap-6 lg:p-5">
        <Link href="/plattform" className="px-1">
          <Logo />
        </Link>
        {nav}
        {userBlock}
      </aside>

      {/* Mobile-Topbar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/plattform" aria-label="Zur Übersicht">
          <Logo className="text-xl" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          className="rounded-full p-2 text-ink hover:bg-ink/5"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-30 flex flex-col gap-6 overflow-y-auto bg-paper p-5 lg:hidden">
          {nav}
          {userBlock}
        </div>
      )}

      <div className="min-w-0">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
