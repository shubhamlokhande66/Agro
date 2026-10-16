"use client";

import Link from "next/link";
import { UsersAdmin } from "@/components/admin/UsersAdmin";
import { AdminGate } from "@/components/monsoon/AdminGate";

/** weather admin: weather dashboard accounts only */
export default function WeatherUsersPage() {
  return (
    <AdminGate>
      <Link href="/monsoon/admin" className="mb-3 inline-block text-[12px] text-ink-faint hover:text-ink">
        ← Weather admin
      </Link>
      <UsersAdmin app="weather" />
    </AdminGate>
  );
}
