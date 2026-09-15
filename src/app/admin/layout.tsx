"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { LoginScreen } from "@/components/layout/LoginScreen";
import { AdminMetaProvider } from "@/lib/admin/context";
import { AdminRail } from "@/components/admin/AdminRail";
import { datasetMeta } from "@/lib/datasets/registry";

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg text-sm text-ink-faint">
      <span className="animate-pulse">Loading admin…</span>
    </div>
  );
}

function AdminHeader({ onMenu }: { onMenu: () => void }) {
  const { username, logout } = useAuth();
  const { mode, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[var(--topbar-bg)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open admin menu"
            className="focusable grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-surface md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/agrolytix-logo.jpg" alt="Agrolytix Research" className="h-8 w-auto sm:h-11" />
          <div className="hidden leading-tight sm:block">
            <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-ink-faint">
              Cotton Terminal
            </div>
            <div className="text-[14px] font-semibold tracking-tight text-ink">Admin Dashboard</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/"
            className="rounded-xl border border-line bg-surface px-2.5 py-2 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink sm:px-3"
          >
            <span aria-hidden>←</span> <span className="hidden sm:inline">Back to site</span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="focusable grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:text-ink"
          >
            {mode === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <span className="hidden rounded-full bg-surface-2 px-2.5 py-1 text-[10.5px] font-semibold text-ink-soft sm:inline">
            ◆ {username ?? "Admin"}
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-line bg-surface px-2.5 py-2 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink sm:px-3"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready, authed, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (ready && authed && !isAdmin) router.replace("/");
  }, [ready, authed, isAdmin, router]);

  if (!ready) return <Splash />;
  if (!authed) return <LoginScreen />;
  if (!isAdmin) return null;

  const key = pathname.startsWith("/admin/") ? pathname.slice("/admin/".length) : null;
  const meta = key === "users" ? { label: "Users" } : key ? datasetMeta(key) : null;

  return (
    <AdminMetaProvider>
      <div className="min-h-screen bg-bg">
        <AdminHeader onMenu={() => setDrawer(true)} />

        {drawer ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close admin menu"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDrawer(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[264px] max-w-[82vw] overflow-y-auto border-r border-line bg-surface shadow-pop animate-rise">
              <AdminRail onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        ) : null}

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1.5 text-[11.5px] text-ink-faint">
            <Link href="/admin" className="font-semibold text-ink hover:text-accent">
              Admin
            </Link>
            {meta ? (
              <>
                <span>/</span>
                <span className="font-medium text-ink-soft">{meta.label}</span>
              </>
            ) : null}
          </div>

          <div className="flex items-start gap-5">
            <aside
              className="sticky top-[68px] hidden w-[230px] shrink-0 overflow-y-auto rounded-2xl border border-line bg-surface md:block"
              style={{ maxHeight: "calc(100vh - 96px)" }}
            >
              <AdminRail />
            </aside>
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </main>
      </div>
    </AdminMetaProvider>
  );
}
