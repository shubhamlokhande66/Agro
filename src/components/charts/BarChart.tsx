"use client";

import { Bar } from "react-chartjs-2";
import type { ChartOptions, Plugin } from "chart.js";
import { ensureChartsRegistered } from "./register";
import { hexToRgba, SERIES } from "./theme";
import { smartAxisLabel } from "@/lib/format";
import { useChartTheme } from "./useChartTheme";

ensureChartsRegistered();

export type BarSeries = {
  label?: string;
  data: (number | null)[];
  colors?: string[];
  color?: string;
  /** draw each bar's value at its outer end (above positive, below negative bars) */
  valueLabel?: (v: number) => string;
};

/** draws the `valueLabel` text of datasets that set one — vertical bars only */
const valueLabels: Plugin<"bar"> = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((ds: any, di) => {
      const fmt = ds.valueLabel as ((v: number) => string) | undefined;
      const meta = chart.getDatasetMeta(di);
      if (!fmt || meta.hidden) return;
      ctx.save();
      ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = ds.labelColor ?? ds.borderColor;
      meta.data.forEach((bar: any, i) => {
        const v = ds.data[i];
        if (v == null || Number.isNaN(v)) return;
        ctx.textBaseline = v >= 0 ? "bottom" : "top";
        ctx.fillText(fmt(v), bar.x, v >= 0 ? bar.y - 3 : bar.y + 3);
      });
      ctx.restore();
    });
  },
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
  stacked?: boolean;
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
  stacked = false,
  tooltipLabel,
}: Props) {
  const t = useChartTheme();

  const catTicks = {
    font: { size: 10 },
    color: t.tick,
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
    color: t.tick,
    maxTicksLimit: 6,
    callback: (v: any) => (yFmt ? yFmt(Number(v)) : v),
  };
  const catGrid = { display: false } as const;
  const valGrid = { color: t.grid, drawTicks: false } as const;

  const hasValueLabels = series.some((s) => s.valueLabel);

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
            labels: {
              color: t.tick,
              font: { size: 11 },
              boxWidth: 8,
              boxHeight: 8,
              padding: 14,
              usePointStyle: true,
              pointStyle: "circle",
            },
          }
        : { display: false },
      tooltip: {
        backgroundColor: t.tooltipBg,
        titleColor: t.tooltipTitle,
        bodyColor: t.tooltipText,
        padding: 11,
        cornerRadius: 10,
        callbacks: tooltipLabel ? { label: (c: any) => tooltipLabel(c) } : {},
      },
    },
    scales: {
      x: {
        stacked,
        ...(horizontal
          ? { ticks: valTicks, grid: valGrid, border: { display: false } }
          : { ticks: catTicks, grid: catGrid, border: { display: false } }),
      },
      y: {
        stacked,
        // headroom so value labels at the bar ends aren't clipped
        ...(hasValueLabels && !horizontal ? { grace: "12%" } : {}),
        ...(horizontal
          ? { ticks: catTicks, grid: catGrid, border: { display: false } }
          : { ticks: valTicks, grid: valGrid, border: { display: false } }),
      },
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Bar
        options={options}
        plugins={hasValueLabels && !horizontal ? [valueLabels] : []}
        data={{
          labels,
          datasets: series.map((s, i) => ({
            label: s.label,
            data: s.data as number[],
            backgroundColor:
              s.colors ?? s.color ?? hexToRgba(SERIES[i % SERIES.length], 0.62),
            borderColor: s.color ?? SERIES[i % SERIES.length],
            borderWidth: 0,
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 44,
            valueLabel: s.valueLabel,
          })),
        }}
      />
    </div>
  );
}
