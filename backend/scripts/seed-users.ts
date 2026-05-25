import { query } from '../src/config/db';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    // Clean up existing
    await query(`DELETE FROM users WHERE email IN ('admin@glowup.test', 'superadmin@glowup.test');`);

    const adminHashed = await bcrypt.hash('admin123', 10);
    const superAdminHashed = await bcrypt.hash('superadmin123', 10);

    await query(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, $3), ($4, $5, $6)`,
      ['admin@glowup.test', adminHashed, 'admin', 'superadmin@glowup.test', superAdminHashed, 'superadmin']
    );

    console.log('Seed completed: users table created and admin & superadmin users inserted.');
    process.exit(0);
  } catch (err: any) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
}

seed();
