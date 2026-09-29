"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/layout/LoginScreen";
import { MonsoonShell } from "@/components/monsoon/Shell";
import { MonsoonDataProvider } from "@/components/monsoon/data";

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useAuth();
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[hsl(222,47%,6%)] text-sm text-slate-500">
        <span className="animate-pulse">Loading monsoon monitor…</span>
      </div>
    );
  }
  if (!authed) return <LoginScreen />;
  return (
    <MonsoonDataProvider>
      <MonsoonShell>{children}</MonsoonShell>
    </MonsoonDataProvider>
  );
}

/** Weather dashboard: its own sign-in (weather accounts only), separate from the cotton app */
export default function MonsoonLayout({ children }: { children: React.ReactNode }) {
  // the monsoon monitor is dark-only (as the original app); shared admin forms read the
  // theme tokens, so switch the page to the dark palette here and restore it on the way out
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "dark");
    return () => {
      if (prev) root.setAttribute("data-theme", prev);
      else root.removeAttribute("data-theme");
    };
  }, []);

  return (
    <AuthProvider app="weather">
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
