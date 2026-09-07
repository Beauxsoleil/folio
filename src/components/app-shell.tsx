"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { UserDTO } from "@/lib/types";
import { cx, initials, formatNumber } from "@/lib/utils";
import { api } from "@/lib/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/shelf", label: "3D Shelf", icon: Boxes },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-brass-300 to-brass-600 shadow-[inset_0_1px_0_rgba(255,244,214,.6),0_10px_22px_-10px_rgba(198,144,63,.9)]">
        <LibraryBig className="h-5 w-5 text-ink-950" strokeWidth={2.2} />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[22px] font-semibold italic tracking-tight text-cream-50">
          Folio
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-cream-500">
          Personal library
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cx(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-200",
              active
                ? "bg-ink-750 text-cream-50 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]"
                : "text-cream-400 hover:bg-ink-800 hover:text-cream-100"
            )}
          >
            <span
              className={cx(
                "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-brass-300 to-brass-600 transition-opacity",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
              )}
            />
            <item.icon className={cx("h-[17px] w-[17px]", active ? "text-brass-300" : "text-cream-500 group-hover:text-cream-300")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  user,
  bookCount,
  children,
}: {
  user: UserDTO;
  bookCount: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const signOut = async () => {
    setSigningOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const sidebarBody = (
    <>
      <div className="px-2 pb-6">
        <Brand />
      </div>
      <NavLinks onNavigate={() => setMobileOpen(false)} />

      <div className="mt-6 rounded-2xl border border-ink-700 bg-ink-850/80 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-500">
          Volumes counted
        </p>
        <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-brass-300">
          {formatNumber(bookCount)}
        </p>
        <p className="mt-0.5 text-[11px] text-cream-500">books on your shelves</p>
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-ink-500 to-ink-700 text-[12px] font-bold text-cream-100">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-cream-100">{user.name}</p>
            <p className="truncate text-[11px] text-cream-500">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="rounded-lg p-2 text-cream-500 transition hover:bg-ink-700 hover:text-wine-300 disabled:opacity-50"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-ink-950">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-700/70 bg-ink-900/80 p-5 backdrop-blur lg:flex">
        {sidebarBody}
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-700/70 bg-ink-950/85 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-ink-600 bg-ink-800 p-2.5 text-cream-200"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-ink-600 bg-ink-900 p-5 animate-drawer-in" style={{ animationName: "none" }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-cream-400 hover:bg-ink-700"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarBody}
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-8 lg:pt-10">{children}</div>
      </main>
    </div>
  );
}
