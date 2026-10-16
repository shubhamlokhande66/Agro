/** A bold section heading for the PDF report (Market Prices, Weather & Rainfall, …) — shown only in
 *  the PDF, where the dashboard's own page chrome is left out. */
export function ReportHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="pdf-only pdf-heading pt-2">
      <div className="flex items-end gap-3 border-b-2 border-[#2f6b73] pb-1.5">
        <span className="h-6 w-1.5 rounded-sm bg-[#2f6b73]" aria-hidden />
        <h2 className="text-[20px] font-bold uppercase tracking-wide text-[#1f2a44]">{children}</h2>
        {sub ? <span className="mb-0.5 text-[11px] font-medium text-ink-faint">{sub}</span> : null}
      </div>
    </div>
  );
}
