"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

type Headline = { title: string; source: string; url: string; publishedAt: number };

const REFRESH_MS = 30 * 60000;

/** "just now" / "45m ago" / "6h ago" / "3d ago" */
function ago(ms: number): string {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/**
 * India cotton headlines from the last 5 days (newest first), refreshed every 30 minutes —
 * the Overview page's news square. Each headline opens the publisher's article in a new tab.
 */
export function CottonNewsBox({ className }: { className?: string }) {
  const [items, setItems] = useState<Headline[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/news/cotton");
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { items: Headline[] };
      setItems(body.items);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <section className={clsx("panel print-hide flex min-h-0 flex-col overflow-hidden", className)} aria-label="India cotton news">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-ink">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Cotton News · India
          </div>
          <div className="mt-0.5 text-[10.5px] text-ink-faint">Latest headlines · last 5 days</div>
        </div>
        {items ? <span className="num shrink-0 text-[10.5px] text-ink-faint">{items.length}</span> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {items === null && !error ? (
          <ul className="space-y-3 p-4" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
              </li>
            ))}
          </ul>
        ) : error && !items?.length ? (
          <div className="grid h-full min-h-[120px] place-items-center p-4 text-center text-[12px] text-ink-faint">
            News is unavailable right now — it will refresh automatically.
          </div>
        ) : items && items.length === 0 ? (
          <div className="grid h-full min-h-[120px] place-items-center p-4 text-center text-[12px] text-ink-faint">
            No cotton headlines in the last 5 days.
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items!.map((n) => (
              <li key={n.url}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focusable block px-4 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className="line-clamp-2 text-[12.5px] font-medium leading-snug text-ink">{n.title}</span>
                  <span className="num mt-1 block truncate text-[10.5px] text-ink-faint">
                    {n.source} · {ago(n.publishedAt)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
