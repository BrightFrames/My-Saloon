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

    // Staff availability & break time columns
    await client.query(`
      ALTER TABLE public.team_members
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

      ALTER TABLE public.services
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

      ALTER TABLE public.salons
        ADD COLUMN IF NOT EXISTS break_time JSONB;
    `);

    // Ensure reviews table and complete rating, feedback & query columns exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
        booking_id UUID,
        customer_id TEXT,
        customer_email TEXT,
        user_name TEXT NOT NULL DEFAULT 'Valued Customer',
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        review TEXT,
        feedback TEXT,
        query TEXT,
        reply TEXT,
        admin_reply TEXT,
        status TEXT DEFAULT 'Pending',
        is_anonymous BOOLEAN DEFAULT false,
        image_url TEXT,
        overall_experience INTEGER DEFAULT 5,
        stylist_skill INTEGER DEFAULT 5,
        staff_behaviour INTEGER DEFAULT 5,
        cleanliness_hygiene INTEGER DEFAULT 5,
        value_for_money INTEGER DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id UUID;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_email TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS feedback TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS query TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS overall_experience INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS stylist_skill INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS staff_behaviour INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS cleanliness_hygiene INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS value_for_money INTEGER DEFAULT 5;
      ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Create staff_leaves table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.staff_leaves (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
        team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
        staff_name TEXT,
        leave_date DATE NOT NULL,
        end_date DATE,
        start_time TEXT,
        end_time TEXT,
        is_full_day BOOLEAN DEFAULT true,
        leave_type TEXT DEFAULT 'full_day',
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}