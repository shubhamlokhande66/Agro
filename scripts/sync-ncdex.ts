/* Pulls NCDEX evening spot prices into the live `prices` dataset — Akola oilcake into Cotton Seed
   Oil Cake and Cotton Seed (+12%), Rajkot kapas into Kapas (× 5) — the same sync the 5 PM cron
   runs (src/app/api/cron/ncdex-spot). Uses the locally installed Chrome (override with CHROME_PATH).
   Run: npm run sync:ncdex                    last 7 days, missing dates only
        npm run sync:ncdex -- 31              last 31 days (NCDEX keeps about a month)
        npm run sync:ncdex -- 31 KAPAS        one symbol only
        npm run sync:ncdex -- --overwrite     replace stored prices for those dates too
        npm run sync:ncdex -- --dry           fetch and print only, save nothing  */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  // import after dotenv so src/db sees DATABASE_URL
  const { NCDEX_SOURCES, fetchNcdexEvening, syncNcdexSpotPrices } = await import("../src/lib/server/ncdexSpot");
  const args = process.argv.slice(2);
  const days = Number(args.find((a) => /^\d+$/.test(a))) || 7;
  const symbols = args.filter((a) => /^[A-Z]+$/.test(a));
  const sources = NCDEX_SOURCES.filter((s) => !symbols.length || symbols.includes(s.symbol));

  if (args.includes("--dry")) {
    const to = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
    const from = new Date(Date.parse(to) - (days - 1) * 86400000).toISOString().slice(0, 10);
    const fetched = await fetchNcdexEvening(sources, from, to);
    for (const s of sources) {
      for (const p of fetched[s.symbol]) {
        const out = s.targets.map((t) => `${t.key} ₹${Math.round(p.price * t.factor)}`).join("  ");
        console.log(`${s.symbol} ${p.date} ${p.time}  ${p.price}  →  ${out}`);
      }
    }
    process.exit(0);
  }

  const report = await syncNcdexSpotPrices({
    days,
    overwrite: args.includes("--overwrite"),
    symbols: symbols.length ? symbols : undefined,
    by: "script:ncdex",
  });
  for (const d of report.dates) {
    console.log(`${d.symbol} ${d.date}  ${Object.entries(d.prices).map(([k, v]) => `${k} ₹${v}`).join("  ")}  ${d.status}`);
  }
  console.log(report.saved ? "✓ prices dataset updated" : "nothing new to save");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
