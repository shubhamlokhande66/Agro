export function PageHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-base font-semibold text-ink sm:text-lg">{title}</h1>
        {sub ? (
          <p className="num mt-1 text-[11px] text-ink-faint">{sub}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
