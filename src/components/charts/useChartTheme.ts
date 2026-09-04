"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/lib/theme";

export type ChartTheme = {
  grid: string;
  tick: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipTitle: string;
  accent: string;
  amber: string;
  info: string;
};

function readVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function useChartTheme(): ChartTheme {
  const { mode } = useTheme();
  const [tick, setTick] = useState(0);

  // re-read the CSS vars a frame after the theme flips
  useEffect(() => {
    const id = requestAnimationFrame(() => setTick((t) => t + 1));
    return () => cancelAnimationFrame(id);
  }, [mode]);

  return useMemo<ChartTheme>(() => {
    const dark = mode === "dark";
    return {
      grid: readVar("--grid-line", "rgba(0,0,0,0.06)"),
      tick: readVar("--text-3", "#8f9389"),
      tooltipBg: dark ? "#0c100e" : "#191b18",
      tooltipText: "#ffffff",
      tooltipTitle: dark ? "#a2aaa1" : "#cfcfca",
      accent: readVar("--accent", "#0f9d63"),
      amber: readVar("--warn", "#c07807"),
      info: readVar("--info", "#2563c9"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tick]);
}
