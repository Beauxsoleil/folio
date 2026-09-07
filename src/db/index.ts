import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // Tuned for serverless (Vercel → Neon): keep pools small per instance and
    // let Neon's pooled endpoint (sslmode=require in the URL) multiplex.
    max: 5,
    connectionTimeoutMillis: 10_000, // covers Neon scale-to-zero wake-up
    idleTimeoutMillis: 60_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
