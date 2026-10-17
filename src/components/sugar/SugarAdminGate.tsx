"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/** sugar admin area: admin accounts only (signed in to the sugar dashboard) */
export function SugarAdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-ink-faint">The sugar admin area is for admin accounts.</p>
        <Link href="/sugar" className="text-xs font-semibold text-accent underline">
          ← Back to the dashboard
        </Link>
      </div>
    );
  }
  return <div className="max-w-6xl">{children}</div>;
}
