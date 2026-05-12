import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('Invalid environment variables:', envVars.error.format());
  process.exit(1);
}

export const env = envVars.data;

// Ensure at least one form of DB access is provided
if (!env.SUPABASE_ANON_KEY && !env.SUPABASE_DB_URL) {
  console.error('Either SUPABASE_ANON_KEY or SUPABASE_DB_URL must be provided');
  process.exit(1);
}
