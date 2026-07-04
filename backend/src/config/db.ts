import { Pool } from "pg";
import { env } from "./env";

const connectionString = env.DATABASE_URL || env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DB_URL is required for Postgres access.",
  );
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on("error", (err) => {
  console.error("[db]: Unexpected idle client error:", err.message || err);
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default { query };
