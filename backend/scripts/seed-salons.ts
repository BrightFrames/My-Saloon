import { query } from '../src/config/db';

async function seed() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS salons (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        image TEXT,
        rating NUMERIC,
        starting_price NUMERIC
      );
    `);

    await query(`DELETE FROM salons;`);

    await query(
      `INSERT INTO salons (name, city, latitude, longitude, image, rating, starting_price)
       VALUES
        ('Glowup Chandigarh 1', 'Chandigarh', 30.7333, 76.7794, 'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=600&auto=format&fit=crop', 4.8, 180.0),
        ('Glowup Chandigarh 2', 'Chandigarh', 30.7415, 76.7821, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop', 4.7, 220.0),
        ('Glowup Chandigarh 3', 'Chandigarh', 30.7218, 76.7684, 'https://images.unsplash.com/photo-1592409563721-d8c0e1c1cbd0?q=80&w=600&auto=format&fit=crop', 4.6, 160.0),
        ('Glowup Chandigarh 4', 'Chandigarh', 30.7540, 76.7845, 'https://images.unsplash.com/photo-1629239838908-73784a4d79bb?q=80&w=600&auto=format&fit=crop', 4.8, 240.0),
        ('Glowup Chandigarh 5', 'Chandigarh', 30.7055, 76.8012, 'https://images.unsplash.com/photo-1610558157672-d37e6529d969?q=80&w=600&auto=format&fit=crop', 4.5, 200.0),
        ('Glowup Noida 1', 'Noida', 28.5355, 77.3910, 'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=600&auto=format&fit=crop', 4.8, 175.0),
        ('Glowup Noida 2', 'Noida', 28.5222, 77.3821, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop', 4.7, 210.0),
        ('Glowup Noida 3', 'Noida', 28.5708, 77.3260, 'https://images.unsplash.com/photo-1592409563721-d8c0e1c1cbd0?q=80&w=600&auto=format&fit=crop', 4.6, 190.0),
        ('Glowup Noida 4', 'Noida', 28.6129, 77.3710, 'https://images.unsplash.com/photo-1629239838908-73784a4d79bb?q=80&w=600&auto=format&fit=crop', 4.8, 230.0),
        ('Glowup Noida 5', 'Noida', 28.4960, 77.4101, 'https://images.unsplash.com/photo-1610558157672-d37e6529d969?q=80&w=600&auto=format&fit=crop', 4.5, 205.0);
      `
    );

    console.log('Seed completed: salons table created and sample rows inserted.');
    process.exit(0);
  } catch (err: any) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
}

seed();
