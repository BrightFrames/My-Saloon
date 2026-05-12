import { Pool } from 'pg';
import { env } from './env';

// Use SUPABASE_DB_URL (Postgres connection string) for direct DB access
if (!env.SUPABASE_DB_URL) {
  throw new Error('SUPABASE_DB_URL is not defined. This file should only be used when a Postgres connection string is provided.');
}

export const pool = new Pool({
  connectionString: env.SUPABASE_DB_URL,
});

// Test initial connection and log status
(async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.info('[db]: Connected to Postgres successfully');
  } catch (err: any) {
    console.error('[db]: Failed to connect to Postgres:', err.message || err);
    // Keep process running so nodemon can show the error and allow fixes
  }
})();

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

export default { query };
