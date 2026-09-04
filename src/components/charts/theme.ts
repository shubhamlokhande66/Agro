import type { ChartOptions, ScriptableContext } from "chart.js";
import { smartAxisLabel } from "@/lib/format";
import type { ChartTheme } from "./useChartTheme";

/** categorical series palette — works on both light and dark grounds */
export const SERIES = [
  "#12a277",
  "#2f7fe0",
  "#e0902f",
  "#d94f9c",
  "#8b6cf0",
  "#12b3a0",
  "#e0605a",
  "#7c8896",
  "#3aa0e6",
];

export function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type BaseOpts = {
  t: ChartTheme;
  yFmt?: (v: number) => string;
  yMin?: number;
  yMax?: number;
  xTicks?: number;
  legend?: boolean;
  smartX?: boolean;
  tooltipLabel?: (ctx: {
    parsed: { x: number; y: number };
    dataset: { label?: string };
    label: string;
  }) => string;
};

function tooltip(t: ChartTheme, cb?: BaseOpts["tooltipLabel"]) {
  return {
    backgroundColor: t.tooltipBg,
    titleColor: t.tooltipTitle,
    bodyColor: t.tooltipText,
    bodyFont: { size: 12 },
    titleFont: { size: 11 },
    padding: 11,
    cornerRadius: 10,
    displayColors: true,
    boxPadding: 4,
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    callbacks: cb ? { label: (c: any) => cb(c) } : {},
  };
}

function legendBlock(t: ChartTheme, show?: boolean) {
  return show
    ? {
        display: true,
        position: "top" as const,
        align: "start" as const,
        labels: {
          color: t.tick,
          font: { size: 11 },
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          usePointStyle: true,
          pointStyle: "circle" as const,
        },
      }
    : { display: false };
}

export function lineOptions(o: BaseOpts): ChartOptions<"line"> {
  const { t } = o;
  const smart = o.smartX ?? true;
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: legendBlock(t, o.legend),
      tooltip: tooltip(
        t,
        o.tooltipLabel ?? (o.yFmt ? (c) => o.yFmt!(c.parsed.y) : undefined),
      ),
    },
    scales: {
      x: {
        ticks: {
          font: { size: 10 },
          color: t.tick,
          maxTicksLimit: o.xTicks ?? 8,
          maxRotation: 0,
          autoSkip: true,
          callback(value: any) {
            const raw = (this as any).getLabelForValue(value);
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
          color: t.tick,
          maxTicksLimit: 6,
          callback: (v: any) => (o.yFmt ? o.yFmt(Number(v)) : v),
        },
        grid: { color: t.grid, drawTicks: false },
        border: { display: false },
      },
    },
  };
}

/** vertical gradient fill for area charts */
export function areaFill(colorHex: string) {
  return (ctx: ScriptableContext<"line">) => {
    const { chart } = ctx;
    const { ctx: c, chartArea } = chart;
    if (!chartArea) return hexToRgba(colorHex, 0.15);
    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, hexToRgba(colorHex, 0.32));
    g.addColorStop(1, hexToRgba(colorHex, 0.01));
    return g;
  };
}

export { tooltip as tooltipBlock, legendBlock };
