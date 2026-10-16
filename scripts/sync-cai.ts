/* Pulls CAI daily spot rates into the live `prices` dataset — the same sync the
   evening cron runs (src/app/api/cron/cai-spot-rates), for backfills / manual runs.
   Run: npm run sync:cai                        last 7 days
        npm run sync:cai -- 2026-09-01 2026-09-28   a date range
        add --overwrite to replace quotes already stored for those dates  */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  // import after dotenv so src/db sees DATABASE_URL
  const { recentTradingDates, syncCaiSpotRates, todayIST } = await import("../src/lib/server/caiSpotRates");

  const args = process.argv.slice(2);
  const overwrite = args.includes("--overwrite");
  const [from, to] = args.filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

  const end = to ?? from ?? todayIST();
  const days = from
    ? Math.round((Date.parse(end) - Date.parse(from)) / 86400000) + 1
    : 7;
  const dates = recentTradingDates(end, days);

  const report = await syncCaiSpotRates(dates, { overwrite, by: "script:cai" });
  for (const d of report.dates) {
    console.log(`${d.date}  ${d.status.padEnd(10)} ${d.added.join(", ")}`);
  }
  console.log(report.saved ? "✓ prices dataset updated" : "nothing new to save");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
