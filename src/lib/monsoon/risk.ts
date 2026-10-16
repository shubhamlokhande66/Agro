/**
 * Kharif weather-risk bullets from the live indicators. The original app asked an LLM to
 * write these; here they're fixed rules over the same numbers, so every statement is
 * traceable to the data shown next to it and nothing is invented when a source is missing.
 */

export type RiskSeverity = "positive" | "neutral" | "warning" | "danger";
export type RiskBullet = { text: string; severity: RiskSeverity };

export type RiskInputs = {
  nino34: number | null;
  iod: number | null;
  allIndia: number | null;
  central: number | null;
  cotton: number | null;
  soybean: number | null;
  deficientCount: number;
  deficientNames: string[];
};

const pct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

export function riskBullets(r: RiskInputs): RiskBullet[] {
  const out: RiskBullet[] = [];

  if (r.allIndia != null) {
    const sev: RiskSeverity = r.allIndia <= -20 ? "danger" : r.allIndia < -10 ? "warning" : r.allIndia <= 10 ? "neutral" : "positive";
    const verdict =
      r.allIndia <= -20 ? "a drought-grade deficit" : r.allIndia < -10 ? "clearly below normal" : r.allIndia <= 10 ? "within the normal band" : "above normal";
    out.push({
      severity: sev,
      text: `All-India monsoon rainfall is ${pct(r.allIndia)} vs the long-period average — ${verdict}. ${r.deficientCount} of 36 subdivisions are deficient (below −19%).`,
    });
  }

  if (r.central != null) {
    const sev: RiskSeverity = r.central <= -20 ? "danger" : r.central < -10 ? "warning" : r.central <= 10 ? "neutral" : "positive";
    out.push({
      severity: sev,
      text: `Central India crop belt (MP, Maharashtra, Vidarbha, Chhattisgarh) is at ${pct(r.central)} — ${
        r.central < -10 ? "moisture stress risk for soybean, cotton and pulses at grain-fill / boll stage" : "soil moisture broadly adequate for standing Kharif crops"
      }.`,
    });
  }

  if (r.cotton != null || r.soybean != null) {
    const parts = [
      r.cotton != null ? `cotton-weighted ${pct(r.cotton)}` : null,
      r.soybean != null ? `soybean-weighted ${pct(r.soybean)}` : null,
    ].filter(Boolean);
    const worst = Math.min(r.cotton ?? 0, r.soybean ?? 0);
    out.push({
      severity: worst <= -20 ? "danger" : worst < -10 ? "warning" : "neutral",
      text: `Production-weighted rainfall: ${parts.join(", ")} — ${
        worst < -10 ? "yield downside risk in the main growing states" : "no major weighted shortfall in the key producing states"
      }.`,
    });
  }

  if (r.nino34 != null) {
    const el = r.nino34 >= 0.5;
    const la = r.nino34 <= -0.5;
    out.push({
      severity: el ? (r.nino34 >= 1.5 ? "danger" : "warning") : la ? "positive" : "neutral",
      text: `Niño 3.4 anomaly ${r.nino34 > 0 ? "+" : ""}${r.nino34.toFixed(2)}°C — ${
        el
          ? `${r.nino34 >= 1.5 ? "strong " : ""}El Niño conditions, historically linked to weaker monsoon rain and late-season deficits`
          : la
            ? "La Niña conditions, historically supportive of monsoon rainfall"
            : "ENSO-neutral, no strong Pacific forcing on the monsoon"
      }.`,
    });
  }

  if (r.iod != null) {
    const pos = r.iod > 0.4;
    const neg = r.iod < -0.4;
    out.push({
      severity: pos ? "positive" : neg ? "warning" : "neutral",
      text: `Indian Ocean Dipole ${r.iod > 0 ? "+" : ""}${r.iod.toFixed(2)} — ${
        pos ? "positive IOD can offset part of an El Niño deficit" : neg ? "negative IOD tends to suppress Indian rainfall" : "neutral, little offset either way"
      }.`,
    });
  }

  if (r.deficientNames.length) {
    out.push({
      severity: "warning",
      text: `Largest deficits: ${r.deficientNames.slice(0, 4).join(", ")}.`,
    });
  }
  return out;
}
