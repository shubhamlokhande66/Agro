import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { getDataset, putDataset } from "@/lib/server/datasets";
import { SUGAR_DEFAULTS, SUGAR_DATASET_KEYS } from "@/data/sugar/defaults";

export const dynamic = "force-dynamic";

/**
 * GET /api/sugar/data — every sugar dataset for the sugar dashboard. A dataset that doesn't exist
 * yet is created from the sample defaults (flagged `_sample`), so Sugar Admin always has
 * something to edit.
 */
export async function GET() {
  if (!(await readSession("sugar"))) return NextResponse.json({ error: "Sign in to the sugar dashboard" }, { status: 401 });
  const datasets: Record<string, unknown> = {};
  const updated: Record<string, number | null> = {};
  await Promise.all(
    SUGAR_DATASET_KEYS.map(async (key) => {
      let row = await getDataset(key);
      if (!row) {
        await putDataset(key, { ...SUGAR_DEFAULTS[key], _sample: true }, null, "sample defaults");
        row = await getDataset(key);
      }
      datasets[key] = row?.data ?? null;
      updated[key] = row?.updatedAt ?? null;
    }),
  );
  return NextResponse.json({ datasets, updated }, { headers: { "cache-control": "no-store" } });
}
