"use client";

import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "./register";
import { lineOptions, SERIES } from "./theme";
import { useChartTheme } from "./useChartTheme";

ensureChartsRegistered();

export type LineSeries = {
  label: string;
  data: (number | null)[];
  color?: string;
  width?: number;
  dashed?: boolean;
  /** fine round dots instead of dashes (takes precedence over `dashed`) */
  dotted?: boolean;
  fill?: boolean;
  fillColor?: string;
  /** curve smoothing, 0 = straight segments point to point (default 0.35) */
  tension?: number;
  /** marker radius at each data point (default 0 = none) */
  pointRadius?: number;
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
  const t = useChartTheme();
  const options = lineOptions({ t, yFmt, yMin, yMax, xTicks, legend, smartX, tooltipLabel });

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
            borderDash: s.dotted ? [1, 4] : s.dashed ? [4, 3] : [],
            borderCapStyle: s.dotted ? ("round" as const) : ("butt" as const),
            pointRadius: s.pointRadius ?? 0,
            pointBackgroundColor: s.color ?? SERIES[i % SERIES.length],
            pointHoverRadius: 4,
            tension: s.tension ?? 0.35,
            fill: s.fill ?? false,
            spanGaps: true,
          })),
        }}
      />
    </div>
  );
}
