"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "./PageHeader";

/**
 * Friendly "dataset not loaded" panel — for when the DB is reachable but this
 * particular dataset is missing or malformed. Pages early-return this.
 */
export function DataMissing({
  title,
  icon,
  dataset,
}: {
  title: string;
  icon?: string;
  dataset?: string;
}) {
  const { isAdmin } = useAuth();
  return (
    <div>
      <PageHeader title={title} icon={icon} />
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-warn-soft text-xl">
          ⚠
        </div>
        <div className="text-sm font-semibold text-ink">This dataset isn’t loaded</div>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-soft">
          The <span className="font-medium text-ink">{title}</span> data is missing
          or empty in the database. Run <code className="num rounded bg-surface-2 px-1">npm run db:seed</code>,
          {isAdmin && dataset ? (
            <>
              {" "}or add it in the{" "}
              <Link href={`/admin/${dataset}`} className="font-semibold text-accent hover:underline">
                admin panel
              </Link>
            </>
          ) : null}
          .
        </p>
      </div>
    </div>
  );
}
