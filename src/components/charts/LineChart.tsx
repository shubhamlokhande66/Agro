"use client";

import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "./register";
import { lineOptions, SERIES } from "./theme";

ensureChartsRegistered();

export type LineSeries = {
  label: string;
  data: (number | null)[];
  color?: string;
  width?: number;
  dashed?: boolean;
  fill?: boolean;
  fillColor?: string;
};

type Props = {
  labels: (string | number)[];
  series: LineSeries[];
  yFmt?: (v: number) => string;
  yMin?: number;
  yMax?: number;
  xTicks?: number;
  legend?: boolean;
  smartX?: boolean;
  height?: number;
  tooltipLabel?: (ctx: {
    dataset: { label?: string };
    parsed: { x: number; y: number };
    label: string;
  }) => string;
};

export default function LineChart({
  labels,
  series,
  yFmt,
  yMin,
  yMax,
  xTicks,
  legend = true,
  smartX = true,
  height = 240,
  tooltipLabel,
}: Props) {
  const options = lineOptions({
    yFmt,
    yMin,
    yMax,
    xTicks,
    legend,
    smartX,
    tooltipLabel,
  });

  return (
    <div style={{ height }} className="relative">
      <Line
        options={options}
        data={{
          labels,
          datasets: series.map((s, i) => ({
            label: s.label,
            data: s.data as number[],
            borderColor: s.color ?? SERIES[i % SERIES.length],
            backgroundColor: s.fillColor ?? "transparent",
            borderWidth: s.width ?? 1.75,
            borderDash: s.dashed ? [4, 3] : [],
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: s.fill ?? false,
            spanGaps: true,
          })),
        }}
      />
    </div>
  );
}
