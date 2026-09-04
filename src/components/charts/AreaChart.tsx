"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "./register";
import { areaFill, lineOptions, TEAL } from "./theme";

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
  color = TEAL,
  yFmt,
  yMin,
  yMax,
  xTicks,
  tooltipLabel,
  smartX = true,
  height = 180,
}: Props) {
  const { auto } = useMemo(() => {
    const valid = data.filter((v): v is number => v != null);
    if (!valid.length) return { auto: {} as { min?: number; max?: number } };
    const mn = Math.min(...valid);
    const mx = Math.max(...valid);
    const pad = (mx - mn) * 0.12 || mx * 0.1 || 1;
    return { auto: { min: Math.max(0, mn - pad), max: mx + pad } };
  }, [data]);

  const options = lineOptions({
    yFmt,
    yMin: yMin ?? auto.min,
    yMax: yMax ?? auto.max,
    xTicks,
    smartX,
    tooltipLabel: tooltipLabel
      ? (c) => tooltipLabel(c.parsed.y)
      : undefined,
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
              borderColor: color,
              backgroundColor: areaFill(
                color.startsWith("#") ? hexToRgba(color, 0.2) : color,
              ),
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: color,
              pointHoverBorderColor: "#fff",
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

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
