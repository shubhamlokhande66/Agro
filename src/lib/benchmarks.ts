import { BENCH } from "@/data/benchmarks";
import { dpValue } from "@/data/production";
import { WASDE_REPORTS, convertWasde } from "@/data/wasde";

export type BenchRow = { source: string; kind: "ours" | "usda" | "trade" | "avg"; a: number | null; b: number | null; note?: string };

export const benchReportMonth = (m: string) => {
  const [y, mo] = m.split("-");
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(mo) - 1]} ${y}`;
};

/** India production estimates for the two benchmark seasons, lakh bales: Agrolytix, USDA (latest WASDE),
 *  each trade house, and the trade average — shared by the Benchmarks page and the Overview report */
export function benchmarkRows(): { sa: string; sb: string; rows: BenchRow[] } {
  const [sa, sb] = BENCH.seasons;
  // Agrolytix: our production dataset; USDA: India production in the latest WASDE, converted to lakh bales
  const latest = WASDE_REPORTS[0];
  const usda = (season: string) => {
    const v = latest?.years.find((y) => y.year === season)?.countries.India?.current.production;
    return v == null ? null : convertWasde(v, "lakh");
  };
  const trade = BENCH.houses.map<BenchRow>((h) => ({ source: h.source, kind: "trade", a: h.a, b: h.b, note: h.asOf }));
  const avg = (key: "a" | "b") => {
    const vals = trade.map((t) => t[key]).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
  };
  const rows: BenchRow[] = [
    { source: "Agrolytix", kind: "ours", a: dpValue("prod", sa, "ALL_INDIA"), b: dpValue("prod", sb, "ALL_INDIA"), note: "Domestic Production" },
    { source: "USDA", kind: "usda", a: usda(sa), b: usda(sb), note: latest ? `WASDE ${benchReportMonth(latest.month)}` : undefined },
    ...trade,
    { source: "Trade average", kind: "avg", a: avg("a"), b: avg("b"), note: trade.map((t) => t.source).join(", ") },
  ];
  return { sa, sb, rows };
}
