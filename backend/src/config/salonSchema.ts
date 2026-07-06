import { pool } from "./db";

export async function ensureSalonsSchema() {
  const client = await pool.connect();

  try {
    await client.query(`
      ALTER TABLE public.salons
        ADD COLUMN IF NOT EXISTS image TEXT,
        ADD COLUMN IF NOT EXISTS rating NUMERIC,
        ADD COLUMN IF NOT EXISTS city TEXT,
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS state TEXT,
        ADD COLUMN IF NOT EXISTS country TEXT,
        ADD COLUMN IF NOT EXISTS starting_price NUMERIC,
        ADD COLUMN IF NOT EXISTS latitude NUMERIC,
        ADD COLUMN IF NOT EXISTS longitude NUMERIC,
        ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS email TEXT,
        ADD COLUMN IF NOT EXISTS description TEXT;
    `);

    // Add new columns to bookings for the accept/reject flow
    await client.query(`
      ALTER TABLE public.bookings
        ADD COLUMN IF NOT EXISTS accepted_by TEXT,
        ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS rejected_by TEXT,
        ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        salon_id UUID NOT NULL,
        booking_id UUID NOT NULL,
        customer_id INTEGER,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}