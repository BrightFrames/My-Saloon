import bcrypt from 'bcryptjs';
import { query } from '../src/config/db';

async function run() {
  try {
    const hash = await bcrypt.hash('1234', 10);
    const result = await query(
      'UPDATE public.users SET pin = $1 WHERE LOWER(email) = LOWER($2) RETURNING id, email',
      [hash, 'himutech10@gmail.com']
    );
    console.log('SUCCESS: PIN set to 1234 for user:', result.rows);
  } catch (err) {
    console.error('ERROR updating PIN:', err);
  }
}

run();
