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
      <PageHeader title={title} icon={icon} />
      <div className="panel mx-auto max-w-lg overflow-hidden p-10 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft text-2xl">
          {icon}
        </div>
        <div className="text-sm font-semibold text-ink">
          {kind === "stub" ? "On the roadmap" : "Coming soon"}
        </div>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-soft">
          {blurb ??
            "This module is planned but not yet available in the source dashboard."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
