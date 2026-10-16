"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/** weather admin area: admins only (signed in to the weather dashboard) */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-slate-400">The weather admin area is for admin accounts.</p>
        <Link href="/monsoon" className="text-xs text-emerald-400 underline">
          ← Back to the dashboard
        </Link>
      </div>
    );
  }
  return <div className="max-w-6xl">{children}</div>;
}
