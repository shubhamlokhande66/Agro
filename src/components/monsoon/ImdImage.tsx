"use client";

import { useState } from "react";

/** an IMD map / satellite image through the weather image relay, with a link-out fallback */
export function ImdImage({ path, alt, fallback, stamp }: { path: string; alt: string; fallback: string; stamp?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const src = `/api/monsoon/image?path=${encodeURIComponent(path)}${stamp ? `&t=${stamp}` : ""}`;

  if (failed === src) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-400">Image unavailable — the IMD server may be down.</p>
        <a
          href={fallback}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
        >
          ↗ View on IMD website
        </a>
      </div>
    );
  }
  return (
    <div className="relative flex min-h-64 justify-center">
      {loaded !== src ? (
        <span className="absolute top-24 h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={alt}
        className="max-h-[640px] max-w-full rounded-lg"
        onLoad={() => setLoaded(src)}
        onError={() => setFailed(src)}
      />
    </div>
  );
}
