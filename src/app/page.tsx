"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AppKey = "cotton" | "weather";

const DASHBOARDS: {
  key: AppKey;
  href: string;
  icon: string;
  title: string;
  sub: string;
  points: string[];
  accent: string;
}[] = [
  {
    key: "cotton",
    href: "/overview",
    icon: "🌾",
    title: "Cotton Dashboard",
    sub: "Agrolytix Cotton Terminal",
    points: ["Domestic & ICE prices", "Arrivals, sowing & production", "Balance sheet, trade & currency"],
    accent: "#0d9e77",
  },
  {
    key: "weather",
    href: "/monsoon",
    icon: "🌧",
    title: "Weather Dashboard",
    sub: "Monsoon Rainfall Risk Monitor",
    points: ["IMD subdivision rainfall & deficits", "ENSO / IOD indices", "Crop-weighted rainfall risk"],
    accent: "#2563eb",
  },
];

/** Entry page: pick a dashboard. Each has its own login (and its own accounts). */
export default function LandingPage() {
  const [signedIn, setSignedIn] = useState<Record<AppKey, boolean>>({ cotton: false, weather: false });

  useEffect(() => {
    for (const app of ["cotton", "weather"] as const) {
      fetch(`/api/auth/me?app=${app}`)
        .then((r) => r.json())
        .then((d) => setSignedIn((s) => ({ ...s, [app]: !!d?.session })))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <img src="/agrolytix-logo.jpg" alt="Agrolytix Research" className="mx-auto h-16 w-auto" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Choose a dashboard</h1>
          <p className="mt-1 text-[13px] text-ink-faint">Each dashboard has its own sign-in.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {DASHBOARDS.map((d) => (
            <Link
              key={d.key}
              href={d.href}
              className="panel panel-hover focusable group flex flex-col p-6 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
                  style={{ background: `${d.accent}1a` }}
                  aria-hidden
                >
                  {d.icon}
                </span>
                {signedIn[d.key] ? (
                  <span className="rounded-full bg-pos-soft px-2.5 py-1 text-[10.5px] font-semibold text-pos">● Signed in</span>
                ) : null}
              </div>
              <h2 className="mt-4 text-[18px] font-semibold tracking-tight text-ink">{d.title}</h2>
              <p className="text-[12px] text-ink-faint">{d.sub}</p>
              <ul className="mt-4 flex-1 space-y-1.5">
                {d.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.accent }} />
                    {p}
                  </li>
                ))}
              </ul>
              <span
                className="mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity group-hover:opacity-90"
                style={{ background: d.accent }}
              >
                {signedIn[d.key] ? "Open" : "Sign in"} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
