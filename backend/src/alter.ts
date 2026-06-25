import { pool } from "./config/db";

async function alter() {
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS video TEXT;");
    await client.query("ALTER TABLE public.services ADD COLUMN IF NOT EXISTS original_price NUMERIC;");
    await client.query("ALTER TABLE public.services ADD COLUMN IF NOT EXISTS discounted_price NUMERIC;");
    await client.query("UPDATE public.services SET original_price = price, discounted_price = price WHERE original_price IS NULL;");
    
    // Home Service columns
    await client.query("ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS home_service_charge NUMERIC DEFAULT 0;");
    await client.query("ALTER TABLE public.services ADD COLUMN IF NOT EXISTS home_service_available BOOLEAN DEFAULT false;");
    await client.query("ALTER TABLE public.services ADD COLUMN IF NOT EXISTS home_service_price NUMERIC;");
    
    await client.query("ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'salon';");
    await client.query("ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS address TEXT;");
    await client.query("ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS landmark TEXT;");
    await client.query("ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS city TEXT;");
    await client.query("ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pincode TEXT;");
    await client.query("ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_charge NUMERIC DEFAULT 0;");
    
    // Salon details columns
    await client.query("ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS about TEXT;");
    await client.query("ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS gallery TEXT[];");
    
    // Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Columns added and initialized");
  } catch(e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}
alter();
