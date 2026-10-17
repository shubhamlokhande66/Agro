"use client";

import Link from "next/link";
import { UsersAdmin } from "@/components/admin/UsersAdmin";
import { SugarAdminGate } from "@/components/sugar/SugarAdminGate";

/** sugar dashboard accounts — approve sign-ups, devices */
export default function SugarUsers() {
  return (
    <SugarAdminGate>
      <Link href="/sugar/admin" className="mb-3 inline-block text-[12px] text-ink-faint hover:text-ink">
        ← Sugar admin
      </Link>
      <UsersAdmin app="sugar" />
    </SugarAdminGate>
  );
}
