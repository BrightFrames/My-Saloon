import { query } from './src/config/db';

async function init() {
  try {
    await query(`DROP TABLE IF EXISTS public.bookings;`);
    await query(`
      CREATE TABLE public.bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name TEXT,
        customer_email TEXT,
        mobile TEXT,
        country_code TEXT,
        hairstyle TEXT,
        stylist TEXT,
        booking_date DATE,
        booking_time TEXT,
        payment_method TEXT,
        notes TEXT,
        total_price NUMERIC,
        booking_status TEXT,
        salon_id UUID REFERENCES public.salons(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Add salon_id to users to map admin to a salon
    await query(`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES public.salons(id);
    `);
    
    console.log('Bookings table configured and users updated!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

init();