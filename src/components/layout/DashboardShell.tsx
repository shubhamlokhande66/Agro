"use client";

import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAuth();
  const [drawer, setDrawer] = useState(false);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-ink-faint">
        Loading…
      </div>
    );
  }

  if (!authed) return <LoginScreen />;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Topbar onMenu={() => setDrawer(true)} />

      <div className="flex flex-1">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[190px] shrink-0 border-r border-[#e8e0d4] lg:block">
          <Sidebar />
        </aside>

        {/* mobile drawer */}
        {drawer ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawer(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[250px] max-w-[80vw] border-r border-[#e8e0d4] shadow-pop animate-fade-in">
              <Sidebar onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        ) : null}

        <main
          className={clsx(
            "min-w-0 flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-8",
          )}
        >
          <div className="mx-auto max-w-[1240px] animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
