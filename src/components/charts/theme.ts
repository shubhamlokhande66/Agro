import type { ChartOptions, ScriptableContext } from "chart.js";
import { smartAxisLabel } from "@/lib/format";

export const TEAL = "#0d9e77";
export const TEAL_FILL = "rgba(13,158,119,0.14)";
export const AMBER = "#f59e0b";
export const NAVY = "#1a4f8a";

/** categorical series palette (kept close to the legacy dashboard) */
export const SERIES = [
  "#0d9e77",
  "#2563eb",
  "#f59e0b",
  "#e84393",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#64748b",
  "#0ea5e9",
];

const TOOLTIP = {
  backgroundColor: "#1a1a18",
  titleColor: "#cfcfca",
  bodyColor: "#ffffff",
  bodyFont: { size: 12 },
  titleFont: { size: 11 },
  padding: 10,
  cornerRadius: 8,
  displayColors: true,
  boxPadding: 4,
} as const;

type BaseOpts = {
  yFmt?: (v: number) => string;
  yMin?: number;
  yMax?: number;
  xTicks?: number;
  legend?: boolean;
  tooltipLabel?: (ctx: { parsed: { x: number; y: number }; dataset: { label?: string }; label: string }) => string;
  indexAxis?: "x" | "y";
  smartX?: boolean;
};

export function lineOptions(o: BaseOpts = {}): ChartOptions<"line"> {
  const smart = o.smartX ?? true;
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: o.legend
        ? {
            display: true,
            position: "top",
            align: "start",
            labels: {
              font: { size: 11 },
              boxWidth: 9,
              boxHeight: 9,
              padding: 12,
              usePointStyle: true,
              pointStyle: "circle",
            },
          }
        : { display: false },
      tooltip: {
        ...TOOLTIP,
        callbacks: o.tooltipLabel
          ? { label: (c: any) => o.tooltipLabel!(c) }
          : o.yFmt
            ? { label: (c: any) => o.yFmt!(c.parsed.y) }
            : {},
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 10 },
          color: "#a3a39c",
          maxTicksLimit: o.xTicks ?? 8,
          maxRotation: 0,
          autoSkip: true,
          callback(value: any) {
            const raw = this.getLabelForValue(value as number);
            return smart ? smartAxisLabel(String(raw)) : raw;
          },
        },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        min: o.yMin,
        max: o.yMax,
        ticks: {
          font: { size: 10 },
          color: "#a3a39c",
          maxTicksLimit: 6,
          callback: (v: any) => (o.yFmt ? o.yFmt(Number(v)) : v),
        },
        grid: { color: "rgba(0,0,0,0.05)", drawTicks: false },
        border: { display: false },
      },
    },
  };
}

export function barOptions(o: BaseOpts = {}): ChartOptions<"bar"> {
  const base = lineOptions(o) as unknown as ChartOptions<"bar">;
  return { ...base, indexAxis: o.indexAxis ?? "x" };
}

/** vertical gradient fill for area charts */
export function areaFill(color: string) {
  return (ctx: ScriptableContext<"line">) => {
    const { chart } = ctx;
    const { ctx: c, chartArea } = chart;
    if (!chartArea) return color;
    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, color.replace("RGBA", "rgba").replace(/[\d.]+\)$/, "0.28)"));
    g.addColorStop(1, color.replace(/[\d.]+\)$/, "0.02)"));
    return g;
  };
}
