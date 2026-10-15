"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";

type Headline = { title: string; source: string; url: string; publishedAt: number };

const REFRESH_MS = 30 * 60000;
const IST = 330 * 60000;

/** "just now" / "45m ago" / "6h ago" / "3d ago" */
function ago(ms: number): string {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** India-time calendar day "YYYY-MM-DD" */
const dayKey = (ms: number) => new Date(ms + IST).toISOString().slice(0, 10);

function dayLabel(key: string): string {
  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 86400000);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(key + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
}

const timeIST = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/**
 * News Feed — India cotton headlines from the last 5 days, newest first, grouped by day.
 * Headlines come from /api/news/cotton (refreshed hourly on the server; this page re-checks
 * every 30 minutes); each opens the publisher's article in a new tab.
 */
export default function NewsFeedPage() {
  const [items, setItems] = useState<Headline[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news/cotton", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { items: Headline[]; fetchedAt: number };
      setItems(body.items);
      setFetchedAt(body.fetchedAt);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const shown = (items ?? []).filter(
      (n) => !query || n.title.toLowerCase().includes(query) || n.source.toLowerCase().includes(query),
    );
    const byDay = new Map<string, Headline[]>();
    for (const n of shown) {
      const k = dayKey(n.publishedAt);
      byDay.set(k, [...(byDay.get(k) ?? []), n]);
    }
    return [...byDay.entries()];
  }, [items, q]);
  const shownCount = groups.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div>
      <PageHeader
        title="News Feed"
        icon="❒"
        sub={
          <>
            India cotton headlines · last 5 days · updates automatically
            {fetchedAt ? ` · checked ${ago(fetchedAt)}` : ""}
          </>
        }
        right={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="focusable rounded-xl border border-line px-3.5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        }
      />

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Latest cotton news
            {items ? <span className="num text-[11px] font-normal text-ink-faint">· {shownCount} headline{shownCount === 1 ? "" : "s"}</span> : null}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search headlines or sources…"
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent sm:w-64"
          />
        </div>

        {items === null && !error ? (
          <ul className="space-y-4 p-5" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="space-y-2">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
              </li>
            ))}
          </ul>
        ) : error && !items?.length ? (
          <div className="p-10 text-center text-[13px] text-ink-faint">
            News is unavailable right now. It will refresh automatically, or try ↻ Refresh.
          </div>
        ) : groups.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-ink-faint">
            {q ? "No headlines match your search." : "No cotton headlines in the last 5 days."}
          </div>
        ) : (
          groups.map(([day, list]) => (
            <section key={day}>
              <div className="sticky top-0 z-10 border-b border-line bg-surface-2 px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint sm:px-5">
                {dayLabel(day)}
              </div>
              <ul className="divide-y divide-line">
                {list.map((n) => (
                  <li key={n.url}>
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focusable group flex items-start gap-4 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                    >
                      <span className="num hidden w-16 shrink-0 pt-0.5 text-[11px] text-ink-faint sm:block">{timeIST(n.publishedAt)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium leading-snug text-ink group-hover:text-accent">{n.title}</span>
                        <span className="num mt-1 block text-[11px] text-ink-faint">
                          {n.source} · {ago(n.publishedAt)}
                        </span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-[12px] text-ink-faint group-hover:text-accent" aria-hidden>
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <p className="mt-4 text-center text-[11px] text-ink-faint">
        Headlines are gathered automatically from public news sources and link to the original publishers.
      </p>
    </div>
  );
}
