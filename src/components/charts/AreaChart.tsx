"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "./register";
import { areaFill, hexToRgba, lineOptions } from "./theme";
import { useChartTheme } from "./useChartTheme";

ensureChartsRegistered();

type Props = {
  labels: (string | number)[];
  data: (number | null)[];
  color?: string;
  yFmt?: (v: number) => string;
  yMin?: number;
  yMax?: number;
  xTicks?: number;
  tooltipLabel?: (v: number) => string;
  smartX?: boolean;
  height?: number;
};

export default function AreaChart({
  labels,
  data,
  color,
  yFmt,
  yMin,
  yMax,
  xTicks,
  tooltipLabel,
  smartX = true,
  height = 180,
}: Props) {
  const t = useChartTheme();
  const line = color ?? t.accent;

  const valid = data.filter((v): v is number => v != null);

  const auto = useMemo(() => {
    if (!valid.length) return {} as { min?: number; max?: number };
    const mn = Math.min(...valid);
    const mx = Math.max(...valid);
    const pad = (mx - mn) * 0.12 || mx * 0.1 || 1;
    return { min: Math.max(0, mn - pad), max: mx + pad };
  }, [valid]);

  // a line needs 2+ points to draw at all — with only a handful, show real dots
  // instead of an invisible chart (pointRadius 0 is the norm for dense series)
  const pointRadius = valid.length <= 3 ? 3 : 0;

  const options = lineOptions({
    t,
    yFmt,
    yMin: yMin ?? auto.min,
    yMax: yMax ?? auto.max,
    xTicks,
    smartX,
    tooltipLabel: tooltipLabel ? (c) => tooltipLabel(c.parsed.y) : undefined,
  });

  return (
    <div style={{ height }} className="relative">
      <Line
        options={options}
        data={{
          labels,
          datasets: [
            {
              data: data as number[],
              borderColor: line,
              backgroundColor: line.startsWith("#")
                ? areaFill(line)
                : hexToRgba("#12a277", 0.15),
              borderWidth: 2,
              pointRadius,
              pointBackgroundColor: line,
              pointBorderColor: "var(--surface)",
              pointBorderWidth: 1.5,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: line,
              pointHoverBorderColor: "var(--surface)",
              pointHoverBorderWidth: 2,
              fill: true,
              tension: 0.35,
              spanGaps: true,
            },
          ],
        }}
      />
    </div>
  );
}
