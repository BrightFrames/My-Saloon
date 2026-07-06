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

    console.log('Seed completed: salons table created. No demo salon rows were inserted.');
    process.exit(0);
  } catch (err: any) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
}

seed();
