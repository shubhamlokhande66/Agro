import { getDb, COLLECTIONS } from "@/db";

export type AuditRow = {
  datasetKey: string;
  action: string;
  by: string | null;
  at: number;
};

export async function getRecentActivity(limit = 20): Promise<AuditRow[]> {
  const db = await getDb();
  const rows = await db
    .collection<AuditRow>(COLLECTIONS.audit)
    .find({}, { projection: { _id: 0, datasetKey: 1, action: 1, by: 1, at: 1 } })
    .sort({ at: -1 })
    .limit(limit)
    .toArray();
  return rows;
}
