"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

let done = false;

export function ensureChartsRegistered() {
  if (done) return;
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend,
  );
  ChartJS.defaults.font.family =
    "var(--font-sans), ui-sans-serif, system-ui, sans-serif";
  ChartJS.defaults.color = "#8f9389";
  done = true;
}
