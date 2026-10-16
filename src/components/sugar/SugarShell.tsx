"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/layout/LoginScreen";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SUGAR_ITEMS, SUGAR_NAV } from "@/lib/sugarNav";
import { SugarTicker } from "./SugarTicker";

const QUICK = [
  { href: "/sugar", label: "Overview", icon: "◎" },
  { href: "/sugar/prices", label: "Prices", icon: "₹" },
  { href: "/sugar/crushing", label: "Crushing", icon: "⚙" },
  { href: "/sugar/balance-sheet", label: "Balance", icon: "⚖" },
];

/** the sugar terminal: the cotton terminal's layout with the sugar menu and its own sign-in */
export function SugarShell({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-sm text-ink-faint">
        <span className="animate-pulse">Loading sugar terminal…</span>
      </div>
    );
  }
  if (!authed) return <LoginScreen />;

  return (
    <div className="flex min-h-screen">
      <aside className="print-hide sticky top-0 hidden h-screen w-[236px] shrink-0 border-r border-line lg:block">
        <Sidebar nav={SUGAR_NAV} subtitle="Sugar Terminal" />
      </aside>
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 h-full w-[264px] max-w-[82vw] border-r border-line shadow-pop animate-rise">
            <Sidebar nav={SUGAR_NAV} subtitle="Sugar Terminal" onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print-hide">
          <Topbar onMenu={() => setDrawer(true)} items={[...SUGAR_ITEMS].sort((a, b) => b.href.length - a.href.length)} />
          <SugarTicker />
        </div>
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-16">
          <div key={pathname} className="print-page mx-auto max-w-[1280px] animate-rise">
            {children}
          </div>
        </main>
        <nav className="print-hide fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-[var(--topbar-bg)] backdrop-blur-md lg:hidden">
          {QUICK.map((item) => {
            const active = item.href === "/sugar" ? pathname === "/sugar" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={clsx("flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium", active ? "text-accent" : "text-ink-faint")}>
                <span className="num text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
