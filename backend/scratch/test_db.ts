import { Pool } from "pg";

const testUrls = [
  "postgresql://postgres.hmxhoatnnidwzwcxjhyo:Sourabh@123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
  "postgresql://postgres.hmxhoatnnidwzwcxjhyo:Sourabh@123@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
  "postgresql://postgres:Sourabh@123@db.hmxhoatnnidwzwcxjhyo.supabase.co:5432/postgres",
];

async function testConnection() {
  for (const url of testUrls) {
    console.log("Testing (15s timeout):", url);
    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });

    try {
      const res = await pool.query("SELECT count(*) FROM public.salons");
      console.log("SUCCESS!", url, "Salons count:", res.rows[0].count);
      await pool.end();
      return url;
    } catch (err: any) {
      console.error("FAILED:", err.message);
      await pool.end().catch(() => {});
    }
  }
}

testConnection();
