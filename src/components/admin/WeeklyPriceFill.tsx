"use client";

import { useState } from "react";
import { DateInput, NumInput } from "@/components/admin/kit";

type Quote = { date: string; price: number | null };

const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Monday–Sunday of the week containing `date` ("YYYY-MM-DD"), stopping at `today` */
export function weekDates(date: string, today: string): string[] {
  const t = Date.parse(date + "T00:00:00Z");
  const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * 86400000;
  return Array.from({ length: 7 }, (_, i) => isoDay(monday + i * 86400000)).filter((d) => d <= today);
}

/** `daily` with every day of the week containing `date` set to `price` (existing quotes replaced) */
export function fillWeek(daily: Quote[], date: string, price: number, today: string): Quote[] {
  const days = new Set(weekDates(date, today));
  return [...daily.filter((q) => !days.has(q.date)), ...[...days].map((d) => ({ date: d, price }))].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/** "Weekly price" helper above a variety's daily table — for series quoted once a week
 *  (e.g. Fibre2Fashion's Tiruppur cotton yarn report): one price fills the whole week. */
export function WeeklyPriceFill({
  daily,
  onChange,
  unit,
}: {
  daily: Quote[];
  onChange: (daily: Quote[]) => void;
  unit: string;
}) {
  const today = isoDay(Date.now() + 330 * 60000); // India
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState<number | null>(null);
  const days = date ? weekDates(date, today) : [];
  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-3">
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
        Weekly price — one price for the whole week
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-40">
          <div className="mb-1 text-[10.5px] text-ink-faint">Any date in the week</div>
          <DateInput value={date} onChange={setDate} />
        </div>
        <div className="w-32">
          <div className="mb-1 text-[10.5px] text-ink-faint">Price ({unit})</div>
          <NumInput value={price} onChange={setPrice} />
        </div>
        <button
          type="button"
          disabled={price == null || !(price > 0) || days.length === 0}
          onClick={() => {
            onChange(fillWeek(daily, date, price!, today));
            setPrice(null);
          }}
          className="focusable rounded-lg bg-accent px-3 py-2 text-[12px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:opacity-40"
        >
          Fill week
        </button>
      </div>
      <p className="mt-1.5 text-[10.5px] text-ink-faint">
        {days.length
          ? `Sets ${fmt(days[0])} – ${fmt(days.at(-1)!)} (${days.length} day${days.length > 1 ? "s" : ""}) to this price, replacing any prices already on those days. Save to apply.`
          : "Pick a date that isn't in the future."}
      </p>
    </div>
  );
}
