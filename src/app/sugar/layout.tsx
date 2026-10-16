"use client";

import { AuthProvider } from "@/lib/auth";
import { SugarShell } from "@/components/sugar/SugarShell";

/** Sugar dashboard: its own sign-in (sugar accounts), separate from cotton and weather */
export default function SugarLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider app="sugar">
      <SugarShell>{children}</SugarShell>
    </AuthProvider>
  );
}
