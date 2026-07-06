import { Pool } from "pg";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env") });

const connectionString =
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing SUPABASE_DB_URL (or DATABASE_URL) in backend/.env");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    const tableCheck = await client.query(
      "SELECT to_regclass('public.team_members') AS table_name",
    );

    if (!tableCheck.rows[0]?.table_name) {
      console.log(
        "public.team_members table does not exist yet. Run backend/src/seed.ts first.",
      );
      return;
    }

    await client.query(`
      ALTER TABLE public.team_members
      ADD COLUMN IF NOT EXISTS service_ids UUID[] DEFAULT '{}';
    `);

    console.log("Successfully altered team_members to add service_ids");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
