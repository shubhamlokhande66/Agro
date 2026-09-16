import { getDb, COLLECTIONS } from "@/db";

/** One free-text notes blob per dashboard section (e.g. "sowing", "overview") — not a
 *  threaded discussion, just the "~20 lines of commentary below the chart" from the
 *  requirements doc. Mirrors src/lib/server/datasets.ts's get/put shape. */
export type CommentDoc = {
  _id: string; // section key
  text: string;
  updatedAt: number;
  updatedBy: string | null;
};

export async function getComment(sectionKey: string): Promise<CommentDoc | null> {
  const db = await getDb();
  return db.collection<CommentDoc>(COLLECTIONS.comments).findOne({ _id: sectionKey });
}

export async function putComment(sectionKey: string, text: string, by: string | null) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  await db
    .collection<CommentDoc>(COLLECTIONS.comments)
    .updateOne({ _id: sectionKey }, { $set: { text, updatedAt: now, updatedBy: by } }, { upsert: true });
  return now;
}
