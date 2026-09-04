const inLakh = new Intl.NumberFormat("en-IN");

/** ₹54,271 */
export function inr(v: number | null | undefined, digits = 0): string {
  if (v == null || Number.isNaN(v)) return "—";
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

/** compact axis money: ₹54k / ₹1.2L */
export function inrCompact(v: number): string {
  if (v >= 100000) return "₹" + (v / 100000).toFixed(1) + "L";
  if (v >= 1000) return "₹" + Math.round(v / 1000) + "k";
  return "₹" + v;
}

export function cents(v: number): string {
  return v + "¢";
}

export function usd(v: number): string {
  return "$" + v;
}

export function num(v: number | null | undefined, digits = 2): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function int(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  return inLakh.format(Math.round(v));
}

/** signed percent change between two values */
export function pctChange(now: number | null, then: number | null): number | null {
  if (now == null || then == null || then === 0) return null;
  return ((now - then) / then) * 100;
}

export function signedPct(v: number | null, digits = 2): string {
  if (v == null || Number.isNaN(v)) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(digits) + "%";
}

export function classForChange(v: number | null): "up" | "down" | "flat" {
  if (v == null || Math.abs(v) < 0.1) return "flat";
  return v > 0 ? "up" : "down";
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** turn "2024-05" → "May '24", "2024" → passthrough, daily labels passthrough */
export function smartAxisLabel(raw: string): string {
  const s = String(raw);
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [yr, mo] = s.split("-");
    return MONTHS[parseInt(mo, 10) - 1] + " '" + yr.slice(2);
  }
  return s;
}

export function todayStamp(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
