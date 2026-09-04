import clsx from "clsx";

export function Card({
  className,
  hover,
  children,
}: {
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("panel p-4 sm:p-5", hover && "panel-hover", className)}>
      {children}
    </div>
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
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold tracking-tight text-ink">
          {title}
        </div>
        {sub ? (
          <div className="mt-0.5 text-[11px] text-ink-faint">{sub}</div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-3 first:mt-0">
      <span className="h-4 w-1 rounded-full bg-accent" />
      <span className="eyebrow">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
