/* Pulls the NCDEX Akola evening oilcake price into the live `prices` dataset (Cotton Seed Oil
   Cake, and Cotton Seed at +12%) — the same sync the 5 PM cron runs (src/app/api/cron/ncdex-spot).
   Uses the locally installed Chrome (override with CHROME_PATH).
   Run: npm run sync:ncdex            last 7 days
        npm run sync:ncdex -- 14      last 14 days
        npm run sync:ncdex -- --dry   fetch and print only, save nothing  */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  // import after dotenv so src/db sees DATABASE_URL
  const { fetchAkolaOilcake, syncNcdexSeedPrices } = await import("../src/lib/server/ncdexSpot");
  const args = process.argv.slice(2);
  const days = Number(args.find((a) => /^\d+$/.test(a))) || 7;

  if (args.includes("--dry")) {
    const to = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
    const from = new Date(Date.parse(to) - (days - 1) * 86400000).toISOString().slice(0, 10);
    for (const p of await fetchAkolaOilcake(from, to)) {
      console.log(`${p.date} ${p.time}  oilcake ₹${Math.round(p.price)}  seed ₹${Math.round(p.price * 1.12)}`);
    }
    process.exit(0);
  }

  const report = await syncNcdexSeedPrices({ days, by: "script:ncdex" });
  for (const d of report.dates) console.log(`${d.date}  oilcake ₹${d.oilcake}  seed ₹${d.seed}  ${d.status}`);
  console.log(report.saved ? "✓ prices dataset updated" : "nothing new to save");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
