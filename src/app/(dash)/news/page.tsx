"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth";

type Item = { tag: string; text: string; meta: string; tone: string };

const SEED: Item[] = [
  {
    tag: "INDIA",
    tone: "accent",
    text: "India 2025-26 crop revised to 288.7 lakh bales — down ~6.5% YoY. Maharashtra and Gujarat see the largest production declines.",
    meta: "Mar 2026 · CAI",
  },
  {
    tag: "TRADE",
    tone: "info",
    text: "Cotton imports surge to ~49 lakh bales in 2025-26, up sharply YoY, as the domestic shortfall drives mill buying from Australia, the US and Brazil.",
    meta: "Mar 2026 · CAI",
  },
  {
    tag: "PRICE",
    tone: "warn",
    text: "Guj-29 domestic rates near ₹54,300/Candy. Prices under pressure from higher imports and sluggish spinning-mill demand.",
    meta: "Mar 2026 · Market",
  },
  {
    tag: "GLOBAL",
    tone: "violet",
    text: "USDA January WASDE nudges world ending stocks higher; China production revised up, US exports steady.",
    meta: "Jan 2026 · USDA",
  },
  {
    tag: "CCI",
    tone: "accent",
    text: "CCI 2025-26 MSP procurement running above 100 lakh bales; OMSS sales tracking near 107 lakh bales for the season.",
    meta: "Feb 2026 · CCI",
  },
];

const TONE: Record<string, string> = {
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
  violet: "bg-violet-soft text-violet",
};

export default function NewsPage() {
  const { canUpload } = useAuth();
  const [items, setItems] = useState<Item[]>(SEED);
  const [draft, setDraft] = useState("");

  return (
    <div>
      <PageHeader
        title="Market News"
        icon="❒"
        sub="India cotton headlines · curated feed"
      />

      {canUpload ? (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a headline…"
              className="min-w-[220px] flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent focus:bg-surface"
            />
            <button
              type="button"
              onClick={() => {
                if (!draft.trim()) return;
                setItems((s) => [
                  { tag: "NOTE", tone: "info", text: draft.trim(), meta: "Just now · Manual" },
                  ...s,
                ]);
                setDraft("");
              }}
              className="focusable rounded-xl bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-accent-contrast hover:bg-accent-strong"
            >
              Add
            </button>
          </div>
        </Card>
      ) : null}

      <Card>
        <ul className="divide-y divide-line">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
              <span
                className={
                  "num h-fit shrink-0 rounded-md px-2 py-1 text-[9.5px] font-bold tracking-wide " +
                  (TONE[it.tone] ?? TONE.info)
                }
              >
                {it.tag}
              </span>
              <div>
                <p className="text-[13px] leading-relaxed text-ink">{it.text}</p>
                <p className="num mt-1 text-[10.5px] text-ink-faint">{it.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
