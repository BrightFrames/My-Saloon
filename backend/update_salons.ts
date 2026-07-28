import { query, pool } from './src/config/db';
async function update() {
  await query('ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
  console.log('Added created_at');
  pool.end();
}
update();
