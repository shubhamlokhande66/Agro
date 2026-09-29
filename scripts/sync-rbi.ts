/* Pulls RBI USD/INR reference rates into the live `currency` dataset — the same
   sync the afternoon cron runs (src/app/api/cron/rbi-usd), for backfills / manual runs.
   Run: npm run sync:rbi                         last ~400 days
        npm run sync:rbi -- 2022-05-01           from a date (RBI's archive starts Apr 2022)
        npm run sync:rbi -- 2022-05-01 2026-09-29  a date range  */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  // import after dotenv so src/db sees DATABASE_URL
  const { syncRbiUsd } = await import("../src/lib/server/rbiUsd");

  const [from, to] = process.argv.slice(2).filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const report = await syncRbiUsd({ from, to, by: "script:rbi" });

  const changed = report.dates.filter((d) => d.status === "added").length;
  console.log(`latest: ${report.latest?.date} = ₹${report.latest?.rate}`);
  console.log(`daily (last 1y): ${report.dates.length} rates, ${changed} new/changed`);
  console.log(`monthly averages rebuilt: ${report.months.length} (${report.months[0]} → ${report.months.at(-1)})`);
  console.log(report.saved ? "✓ currency dataset updated" : "nothing new to save");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
