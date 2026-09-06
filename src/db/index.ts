import { MongoClient, type Db } from "mongodb";

const uri = process.env.DATABASE_URL ?? process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB || "agro";

if (!uri) {
  // Don't throw at import time (breaks `next build` page-data collection);
  // fail on first use instead.
  console.warn("[db] DATABASE_URL / MONGODB_URI is not set");
}

// Cache the client across hot-reloads (dev) and serverless invocations (prod).
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function clientPromise(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}

export const COLLECTIONS = {
  datasets: "datasets",
  audit: "audit_log",
} as const;
