"use client";

import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "./register";
import { hexToRgba, lineOptions } from "./theme";
import { useChartTheme } from "./useChartTheme";

ensureChartsRegistered();

type Axis = {
  label: string;
  data: (number | null)[];
  color: string;
  fmt: (v: number) => string;
};

type Props = {
  labels: (string | number)[];
  left: Axis;
  right: Axis;
  height?: number;
  xTicks?: number;
};

export default function ComboChart({
  labels,
  left,
  right,
  height = 220,
  xTicks = 12,
}: Props) {
  const t = useChartTheme();
  const base = lineOptions({ t, legend: true, xTicks });

  return (
    <div style={{ height }} className="relative">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: left.label,
              data: left.data as number[],
              borderColor: left.color,
              backgroundColor: hexToRgba(left.color, 0.08),
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              fill: true,
              tension: 0.35,
              yAxisID: "y",
              spanGaps: true,
            },
            {
              label: right.label,
              data: right.data as number[],
              borderColor: right.color,
              backgroundColor: hexToRgba(right.color, 0.08),
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              fill: true,
              tension: 0.35,
              yAxisID: "y2",
              spanGaps: true,
            },
          ],
        }}
        options={{
          ...base,
          scales: {
            ...base.scales,
            y: {
              position: "left",
              ticks: {
                font: { size: 10 },
                color: t.tick,
                maxTicksLimit: 6,
                callback: (v: any) => left.fmt(Number(v)),
              },
              grid: { color: t.grid, drawTicks: false },
              border: { display: false },
            },
            y2: {
              position: "right",
              ticks: {
                font: { size: 10 },
                color: t.tick,
                maxTicksLimit: 6,
                callback: (v: any) => right.fmt(Number(v)),
              },
              grid: { display: false },
              border: { display: false },
            },
          },
        }}
      />
    </div>
  );
}
