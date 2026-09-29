"use client";

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
  return (
    <AuthProvider app="weather">
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
