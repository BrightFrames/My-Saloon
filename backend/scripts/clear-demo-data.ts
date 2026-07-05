import { query } from '../src/config/db';

async function clearDemoData() {
  const demoEmails = [
    'admin@glowup.test',
    'superadmin@glowup.test',
    'elena@glowup.test',
    'marcus@glowup.test',
    'sophie@glowup.test',
  ];

  const demoSalonNames = [
    'Glowup Chandigarh 1',
    'Glowup Chandigarh 2',
    'Glowup Chandigarh 3',
    'Glowup Chandigarh 4',
    'Glowup Chandigarh 5',
    'Glowup Noida 1',
    'Glowup Noida 2',
    'Glowup Noida 3',
    'Glowup Noida 4',
    'Glowup Noida 5',
  ];

  try {
    await query(`
      DELETE FROM public.reviews
      WHERE salon_id IN (
        SELECT id FROM public.salons
        WHERE name = ANY($1) OR name ILIKE 'Glowup%' OR city IN ('Chandigarh', 'Noida')
      )
    `, [demoSalonNames]);

    await query(`
      DELETE FROM public.bookings
      WHERE salon_id IN (
        SELECT id FROM public.salons
        WHERE name = ANY($1) OR name ILIKE 'Glowup%' OR city IN ('Chandigarh', 'Noida')
      )
      OR customer_email = ANY($2)
    `, [demoSalonNames, demoEmails]);

    await query(`
      DELETE FROM public.services
      WHERE salon_id IN (
        SELECT id FROM public.salons
        WHERE name = ANY($1) OR name ILIKE 'Glowup%' OR city IN ('Chandigarh', 'Noida')
      )
    `, [demoSalonNames]);

    await query(`
      DELETE FROM public.users
      WHERE email = ANY($1)
    `, [demoEmails]);

    await query(`
      DELETE FROM public.salons
      WHERE name = ANY($1) OR name ILIKE 'Glowup%' OR city IN ('Chandigarh', 'Noida')
    `, [demoSalonNames]);

    console.log('Demo credentials and demo salons removed from the database.');
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to clear demo data:', err.message || err);
    process.exit(1);
  }
}

clearDemoData();
