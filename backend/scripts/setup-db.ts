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
        starting_price NUMERIC,
        latitude NUMERIC,
        longitude NUMERIC
      );
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

    // 5. Check if salons exist, if not seed some mock salons
    const salonCountRes = await client.query('SELECT COUNT(*) FROM public.salons');
    let salonId: string | null = null;
    if (parseInt(salonCountRes.rows[0].count) === 0) {
      console.log('[setup-db]: Database has no salons. Seeding initial salon...');
      const insertSalonRes = await client.query(`
        INSERT INTO public.salons (name, image, rating, city, starting_price, latitude, longitude)
        VALUES (
          'Glowup Signature Salon',
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
          5.0,
          'New York',
          150,
          40.7128,
          -74.0060
        ) RETURNING id;
      `);
      salonId = insertSalonRes.rows[0].id;

      // Seed initial services
      console.log('[setup-db]: Seeding services for initial salon...');
      await client.query(`
        INSERT INTO public.services (salon_id, name, price, duration) VALUES
        ($1, 'Signature Haircut', 85, '60 mins'),
        ($1, 'Premium Balayage', 240, '180 mins'),
        ($1, 'Signature Silk Facial', 145, '60 mins'),
        ($1, 'Keratin Treatment', 300, '90 mins')
      `, [salonId]);
    } else {
      const existingSalonRes = await client.query('SELECT id FROM public.salons LIMIT 1');
      salonId = existingSalonRes.rows[0].id;
    }

    // 6. Seed mock admins and team members
    console.log('[setup-db]: Seeding users...');
    const adminHashed = await bcrypt.hash('admin123', 10);
    const superAdminHashed = await bcrypt.hash('superadmin123', 10);

    // Clean existing mock accounts to prevent conflict
    await client.query(`DELETE FROM public.users WHERE email IN ('admin@glowup.test', 'superadmin@glowup.test');`);

    // Insert admin and superadmin mapped to our seeded/existing salon
    await client.query(`
      INSERT INTO public.users (email, password, role, salon_id) VALUES
      ('admin@glowup.test', $1, 'admin', $3),
      ('superadmin@glowup.test', $2, 'superadmin', $3)
    `, [adminHashed, superAdminHashed, salonId]);

    // Seed stylists/team members in the users table for this salon
    const stylist1Hashed = await bcrypt.hash('stylist123', 10);
    await client.query(`DELETE FROM public.users WHERE email IN ('elena@glowup.test', 'marcus@glowup.test', 'sophie@glowup.test');`);
    await client.query(`
      INSERT INTO public.users (email, password, role, salon_id) VALUES
      ('elena@glowup.test', $1, 'stylist', $2),
      ('marcus@glowup.test', $1, 'stylist', $2),
      ('sophie@glowup.test', $1, 'stylist', $2)
    `, [stylist1Hashed, salonId]);

    // 7. Seed some initial mock bookings to make the dashboard dynamic out of the box
    console.log('[setup-db]: Seeding initial mock bookings...');
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await client.query(`
      INSERT INTO public.bookings (
        customer_name, customer_email, phone, mobile, service_name, hairstyle, 
        stylist, appointment_date, booking_date, appointment_time, booking_time, 
        booking_status, payment_status, payment_method, total_price, salon_id, created_at
      ) VALUES
      ('Jane Doe', 'jane@example.com', '9876543210', '9876543210', 'Signature Haircut', 'Signature Haircut', 'Elena V.', $1, $1, '10:00 AM', '10:00 AM', 'confirmed', 'paid', 'credit_card', 85.00, $4, NOW()),
      ('Alice Smith', 'alice@example.com', '9876543211', '9876543211', 'Premium Balayage', 'Premium Balayage', 'Marcus T.', $1, $1, '01:00 PM', '01:00 PM', 'confirmed', 'pending', 'cash', 240.00, $4, NOW()),
      ('Bob Johnson', 'bob@example.com', '9876543212', '9876543212', 'Signature Silk Facial', 'Signature Silk Facial', 'Sophie L.', $2, $2, '11:00 AM', '11:00 AM', 'confirmed', 'pending', 'upi', 145.00, $4, NOW()),
      ('Charlie Brown', 'charlie@example.com', '9876543213', '9876543213', 'Signature Haircut', 'Signature Haircut', 'Elena V.', $3, $3, '02:00 PM', '02:00 PM', 'completed', 'paid', 'credit_card', 85.00, $4, NOW() - INTERVAL '1 DAY')
    `, [todayStr, tomorrowStr, yesterdayStr, salonId]);

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
