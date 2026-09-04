import Link from "next/link";
import { PageHeader } from "./PageHeader";

export function ComingSoon({
  title,
  icon,
  kind = "soon",
  blurb,
}: {
  title: string;
  icon: string;
  kind?: "soon" | "stub";
  blurb?: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="card mx-auto max-w-xl p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface2 text-2xl">
          {icon}
        </div>
        <div className="text-sm font-semibold text-ink">
          {kind === "stub" ? "Being migrated" : "Coming soon"}
        </div>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-soft">
          {blurb ??
            (kind === "stub"
              ? "This section is part of the dashboard and will be rebuilt in the next iteration of the Next.js migration."
              : "This module is planned but not yet available in the source dashboard.")}
        </p>
        <Link
          href="/prices"
          className="mt-6 inline-flex rounded-lg bg-brand-navy px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-navy-deep"
        >
          Back to Prices
        </Link>
      </div>
    </div>
  );
}
