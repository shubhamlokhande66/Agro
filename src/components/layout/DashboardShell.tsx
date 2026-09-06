"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { DatasetProvider } from "@/lib/datasets/provider";
import { useDataState } from "@/lib/datasets/store";
import { LoginScreen } from "./LoginScreen";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MarketTicker } from "./MarketTicker";
import { QUICK_NAV } from "@/lib/nav";

function Splash({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-bg text-sm text-ink-faint">
      <span className="animate-pulse">{label}</span>
    </div>
  );
}

function Inner({ children }: { children: React.ReactNode }) {
  const dataReady = useDataState((s) => s.ready);
  const dataError = useDataState((s) => s.error);
  const version = useDataState((s) => s.version);
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  if (dataError) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-6 text-center">
        <div>
          <div className="text-sm font-semibold text-neg">Couldn’t load data</div>
          <p className="mt-1 max-w-sm text-[12px] text-ink-faint">{dataError}</p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="mt-4 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-contrast"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!dataReady) return <Splash label="Loading market data…" />;

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 border-r border-line lg:block">
        <Sidebar />
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[264px] max-w-[82vw] border-r border-line shadow-pop animate-rise">
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setDrawer(true)} />
        <MarketTicker />

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-16">
          <div key={`${pathname}:${version}`} className="mx-auto max-w-[1280px] animate-rise">
            {children}
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-[var(--topbar-bg)] backdrop-blur-md lg:hidden">
          {QUICK_NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                  active ? "text-accent" : "text-ink-faint",
                )}
              >
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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAuth();

  if (!ready) return <Splash label="Loading terminal…" />;
  if (!authed) return <LoginScreen />;

  return (
    <DatasetProvider>
      <Inner>{children}</Inner>
    </DatasetProvider>
  );
}
