"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { datasetMeta } from "@/lib/datasets/registry";

/** small "edit this data" strip shown only to admins */
export function AdminHint({ dataset }: { dataset: string }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  const meta = datasetMeta(dataset);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface-2/50 px-3.5 py-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-soft text-[13px]">✎</span>
      <span className="text-[12px] text-ink-soft">
        Edit <span className="font-semibold text-ink">{meta?.label ?? dataset}</span> directly
        in the admin panel — changes go live for everyone.
      </span>
      <Link
        href={`/admin/${dataset}`}
        className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-accent-contrast hover:bg-accent-strong"
      >
        Open editor →
      </Link>
    </div>
  );
}
