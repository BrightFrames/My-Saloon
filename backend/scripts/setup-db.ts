import { query, pool } from '../src/config/db';
import bcrypt from 'bcryptjs';

async function setupDatabase() {
  console.log('[setup-db]: Starting database setup and migrations...');
  const client = await pool.connect();
  try {
    // 1. Create salons table
    console.log('[setup-db]: Ensuring salons table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.salons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        rating NUMERIC,
        city TEXT,
        address TEXT,
        state TEXT,
        country TEXT,
        starting_price NUMERIC,
        latitude NUMERIC,
        longitude NUMERIC,
        google_maps_link TEXT,
        phone TEXT,
        email TEXT,
        description TEXT
      );
    `);

    await client.query(`
      ALTER TABLE public.salons
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS state TEXT,
      ADD COLUMN IF NOT EXISTS country TEXT,
      ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);

    // 2. Create users table (also maps salon admins and team members)
    console.log('[setup-db]: Ensuring users table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Alter users table to make sure salon_id column exists
    await client.query(`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL;
    `);

    // 3. Create bookings table
    console.log('[setup-db]: Setting up bookings table with all columns...');
    // We safely alter or drop/create. Since this is in development, we recreate or ensure columns are added.
    // To ensure exact column matches for Step 1, we drop bookings table if exists (like in init-bookings.ts) to establish a clean, correct schema.
    await client.query(`DROP TABLE IF EXISTS public.bookings CASCADE;`);
    
    await client.query(`
      CREATE TABLE public.bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INT REFERENCES public.users(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        phone TEXT,
        mobile TEXT,
        country_code TEXT DEFAULT '+91',
        service_name TEXT,
        hairstyle TEXT,
        stylist TEXT,
        appointment_date DATE,
        booking_date DATE,
        appointment_time TEXT,
        booking_time TEXT,
        booking_status TEXT NOT NULL DEFAULT 'confirmed',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        notes TEXT,
        total_price NUMERIC NOT NULL DEFAULT 0,
        salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Create services table
    console.log('[setup-db]: Ensuring services table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        duration TEXT NOT NULL
      );
    `);

    // 5. Setup main admin user
    console.log('[setup-db]: Setting up main admin user...');
    
    const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL;
    const mainAdminPassword = process.env.MAIN_ADMIN_PASSWORD;
    
    if (!mainAdminEmail || !mainAdminPassword) {
      throw new Error('MAIN_ADMIN_EMAIL and MAIN_ADMIN_PASSWORD must be set in .env file');
    }
    
    // Check if main admin already exists
    const adminExists = await client.query('SELECT id FROM public.users WHERE email = $1', [mainAdminEmail]);
    
    if (adminExists.rows.length === 0) {
      const mainAdminHashed = await bcrypt.hash(mainAdminPassword, 10);
      await client.query(`
        INSERT INTO public.users (email, password, role, salon_id) 
        VALUES ($1, $2, $3, NULL)
      `, [mainAdminEmail, mainAdminHashed, 'superadmin']);
      console.log(`[setup-db]: Main admin user created: ${mainAdminEmail}`);
    } else {
      console.log(`[setup-db]: Main admin user already exists: ${mainAdminEmail}`);
    }

    console.log('[setup-db]: Database setup, migrations, and seeding completed successfully!');
  } catch (err: any) {
    console.error('[setup-db]: Failed setting up the database:', err.message || err);
    throw err;
  } finally {
    client.release();
  }
}

// Execute migration
setupDatabase().then(() => {
  pool.end();
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
