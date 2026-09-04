"use client";

import { Line } from "react-chartjs-2";
import { ensureChartsRegistered } from "./register";
import { areaFill } from "./theme";
import { useChartTheme } from "./useChartTheme";

ensureChartsRegistered();

/** tiny inline trend line — no axes, no grid */
export default function Sparkline({
  data,
  color,
  height = 34,
  fill = true,
}: {
  data: (number | null)[];
  color?: string;
  height?: number;
  fill?: boolean;
}) {
  const t = useChartTheme();
  const c = color ?? t.accent;
  const valid = data.filter((v): v is number => v != null);
  const min = valid.length ? Math.min(...valid) : 0;
  const max = valid.length ? Math.max(...valid) : 1;

  return (
    <div style={{ height }} className="relative">
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [
            {
              data: data as number[],
              borderColor: c,
              backgroundColor: fill && c.startsWith("#") ? areaFill(c) : "transparent",
              borderWidth: 1.75,
              pointRadius: 0,
              fill,
              tension: 0.4,
              spanGaps: true,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false, min: min - (max - min) * 0.15, max: max + (max - min) * 0.15 },
          },
          elements: { line: { borderCapStyle: "round" } },
        }}
      />
    </div>
  );
}
