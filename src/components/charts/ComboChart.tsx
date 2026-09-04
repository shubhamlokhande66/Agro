"use client";

import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "./register";
import { lineOptions } from "./theme";

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

/** dual-axis line chart (e.g. ICE cotton vs Brent crude) */
export default function ComboChart({
  labels,
  left,
  right,
  height = 220,
  xTicks = 12,
}: Props) {
  const base = lineOptions({ legend: true, xTicks });

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
                color: "#a3a39c",
                maxTicksLimit: 6,
                callback: (v: any) => left.fmt(Number(v)),
              },
              grid: { color: "rgba(0,0,0,0.05)", drawTicks: false },
              border: { display: false },
            },
            y2: {
              position: "right",
              ticks: {
                font: { size: 10 },
                color: "#a3a39c",
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

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}
