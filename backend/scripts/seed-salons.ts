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
        ('Glowup London', 'London', 51.5074, -0.1278, 'https://via.placeholder.com/300x200', 4.7, 45.0),
        ('Shoreditch Styles', 'London', 51.5260, -0.0800, 'https://via.placeholder.com/300x200', 4.5, 30.0),
        ('Camden Cuts', 'London', 51.5390, -0.1430, 'https://via.placeholder.com/300x200', 4.3, 25.0);
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
