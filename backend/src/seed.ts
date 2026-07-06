import { pool } from "./config/db";

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Seeding database...");

    // Ensure schema exists for production/dev - create necessary tables without inserting mock data.
    // Keep existing 'salons' table to store salon profile info used across the app.
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.salons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        image TEXT,
        logo TEXT,
        rating NUMERIC,
        starting_price NUMERIC,
        latitude NUMERIC,
        longitude NUMERIC,
        google_maps_link TEXT,
        video TEXT,
        phone TEXT,
        email TEXT,
        working_hours JSONB,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        duration INTEGER NOT NULL,
        image_url TEXT,
        category TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        role TEXT,
        experience TEXT,
        image_url TEXT,
        service_ids UUID[] DEFAULT '{}',
        availability JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // No mock inserts — keep DB empty so frontends rely on real Admin-created data.
    console.log("Database schema ensured (no mock inserts).");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
