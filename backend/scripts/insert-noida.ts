import { query } from '../src/config/db';

async function run() {
  try {
    const rows = [
      ['Glowup Noida 1', 'Noida', 28.5355, 77.3910, 'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=600&auto=format&fit=crop', 4.8, 175.0],
      ['Glowup Noida 2', 'Noida', 28.5222, 77.3821, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop', 4.7, 210.0],
      ['Glowup Noida 3', 'Noida', 28.5708, 77.3260, 'https://images.unsplash.com/photo-1592409563721-d8c0e1c1cbd0?q=80&w=600&auto=format&fit=crop', 4.6, 190.0],
      ['Glowup Noida 4', 'Noida', 28.6129, 77.3710, 'https://images.unsplash.com/photo-1629239838908-73784a4d79bb?q=80&w=600&auto=format&fit=crop', 4.8, 230.0],
      ['Glowup Noida 5', 'Noida', 28.4960, 77.4101, 'https://images.unsplash.com/photo-1610558157672-d37e6529d969?q=80&w=600&auto=format&fit=crop', 4.5, 205.0],
    ];

    for (const r of rows) {
      await query(
        `INSERT INTO salons (name, city, latitude, longitude, image, rating, starting_price)
         SELECT $1, $2, $3, $4, $5, $6, $7
         WHERE NOT EXISTS (SELECT 1 FROM salons WHERE name = $1)`,
        r
      );
    }

    const res = await query("SELECT id,name,city FROM salons WHERE city ILIKE 'Noida'");
    console.log('Noida salons:', res.rows);
    process.exit(0);
  } catch (err: any) {
    console.error('Insert-noida failed:', err.message || err);
    process.exit(1);
  }
}

run();
