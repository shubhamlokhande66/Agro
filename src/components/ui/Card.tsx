import clsx from "clsx";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("card p-4 sm:p-5", className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  sub,
  right,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        {sub ? (
          <div className="mt-0.5 text-[11px] text-ink-faint">{sub}</div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="section-label">{children}</div>;
}
