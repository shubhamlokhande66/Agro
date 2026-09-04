"use client";

import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { ensureChartsRegistered } from "./register";
import { SERIES } from "./theme";
import { smartAxisLabel } from "@/lib/format";

ensureChartsRegistered();

export type BarSeries = {
  label?: string;
  data: (number | null)[];
  colors?: string[];
  color?: string;
};

type Props = {
  labels: (string | number)[];
  series: BarSeries[];
  yFmt?: (v: number) => string;
  xTicks?: number;
  legend?: boolean;
  horizontal?: boolean;
  height?: number;
  smartX?: boolean;
  tooltipLabel?: (ctx: {
    dataset: { label?: string };
    parsed: { x: number; y: number };
    label: string;
  }) => string;
};

export default function BarChart({
  labels,
  series,
  yFmt,
  xTicks,
  legend = false,
  horizontal = false,
  height = 240,
  smartX = false,
  tooltipLabel,
}: Props) {
  const catTicks = {
    font: { size: 10 },
    color: "#a3a39c",
    autoSkip: !horizontal,
    maxTicksLimit: xTicks ?? (horizontal ? 20 : 8),
    maxRotation: 0,
    callback(value: any) {
      const raw = (this as any).getLabelForValue(value);
      return smartX ? smartAxisLabel(String(raw)) : raw;
    },
  };
  const valTicks = {
    font: { size: 10 },
    color: "#a3a39c",
    maxTicksLimit: 6,
    callback: (v: any) => (yFmt ? yFmt(Number(v)) : v),
  };
  const catGrid = { display: false } as const;
  const valGrid = { color: "rgba(0,0,0,0.05)", drawTicks: false } as const;

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: legend
        ? {
            display: true,
            position: "top",
            align: "start",
            labels: { font: { size: 11 }, boxWidth: 9, boxHeight: 9, padding: 12, usePointStyle: true, pointStyle: "circle" },
          }
        : { display: false },
      tooltip: {
        backgroundColor: "#1a1a18",
        titleColor: "#cfcfca",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 8,
        callbacks: tooltipLabel ? { label: (c: any) => tooltipLabel(c) } : {},
      },
    },
    scales: {
      x: horizontal
        ? { ticks: valTicks, grid: valGrid, border: { display: false } }
        : { ticks: catTicks, grid: catGrid, border: { display: false } },
      y: horizontal
        ? { ticks: catTicks, grid: catGrid, border: { display: false } }
        : { ticks: valTicks, grid: valGrid, border: { display: false } },
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Bar
        options={options}
        data={{
          labels,
          datasets: series.map((s, i) => ({
            label: s.label,
            data: s.data as number[],
            backgroundColor:
              s.colors ?? s.color ?? hexToRgba(SERIES[i % SERIES.length], 0.6),
            borderColor: s.color ?? SERIES[i % SERIES.length],
            borderWidth: 0,
            borderRadius: 3,
            borderSkipped: false,
            maxBarThickness: 46,
          })),
        }}
      />
    </div>
  );
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}
