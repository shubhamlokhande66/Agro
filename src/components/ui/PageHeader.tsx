export function PageHeader({
  title,
  sub,
  right,
  icon,
}: {
  title: string;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-[19px] font-semibold tracking-tight text-ink sm:text-[22px]">
          {icon ? (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent-soft text-base">
              {icon}
            </span>
          ) : null}
          {title}
        </h1>
        {sub ? (
          <p className="num mt-1.5 text-[11px] text-ink-faint">{sub}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
