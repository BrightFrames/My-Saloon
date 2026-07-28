import { Pool } from "pg";
import dns from "dns";
import { promisify } from "util";

const lookup = promisify(dns.lookup);

const candidates = [
  { name: "Direct Supabase Host", url: "postgresql://postgres:Sourabh@123@db.hmxhoatnnidwzwcxjhyo.supabase.co:5432/postgres", host: "db.hmxhoatnnidwzwcxjhyo.supabase.co" },
  { name: "Pooler aws-0-ap-northeast-1", url: "postgresql://postgres.hmxhoatnnidwzwcxjhyo:Sourabh@123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres", host: "aws-0-ap-northeast-1.pooler.supabase.com" },
  { name: "Pooler aws-0-ap-south-1", url: "postgresql://postgres.hmxhoatnnidwzwcxjhyo:Sourabh@123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres", host: "aws-0-ap-south-1.pooler.supabase.com" },
  { name: "Pooler aws-0-ap-southeast-1", url: "postgresql://postgres.hmxhoatnnidwzwcxjhyo:Sourabh@123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres", host: "aws-0-ap-southeast-1.pooler.supabase.com" },
];

async function run() {
  for (const item of candidates) {
    console.log(`\n--- Testing ${item.name} (${item.host}) ---`);
    try {
      const ip = await lookup(item.host);
      console.log(`DNS Resolved IP: ${ip.address}`);
      
      const pool = new Pool({
        connectionString: item.url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

      const res = await pool.query("SELECT count(*) FROM public.salons");
      console.log(`✅ SUCCESS! Found ${res.rows[0].count} salons in DB.`);
      console.log(`WORKING URL: ${item.url}`);
      await pool.end();
      process.exit(0);
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}`);
    }
  }
}

run();
