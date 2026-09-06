import { getDb, COLLECTIONS } from "@/db";
import { DATASET_KEYS } from "@/lib/datasets/registry";

export type DatasetDoc = {
  _id: string; // dataset key
  kind: string;
  label: string;
  data: unknown;
  updatedAt: number;
  updatedBy: string | null;
};

export async function getAllDatasets(): Promise<Record<string, unknown>> {
  const db = await getDb();
  const rows = await db
    .collection<DatasetDoc>(COLLECTIONS.datasets)
    .find({}, { projection: { data: 1 } })
    .toArray();
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r._id] = r.data;
  return out;
}

export async function getDataset(key: string): Promise<DatasetDoc | null> {
  const db = await getDb();
  return db.collection<DatasetDoc>(COLLECTIONS.datasets).findOne({ _id: key });
}

export async function putDataset(
  key: string,
  data: unknown,
  by: string | null,
  note = "edit",
) {
  if (!DATASET_KEYS.includes(key)) throw new Error(`Unknown dataset "${key}"`);
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  await db
    .collection<DatasetDoc>(COLLECTIONS.datasets)
    .updateOne(
      { _id: key },
      { $set: { data, updatedAt: now, updatedBy: by } },
      { upsert: true },
    );
  await db.collection(COLLECTIONS.audit).insertOne({
    datasetKey: key,
    action: note,
    by,
    at: now,
  });
}
