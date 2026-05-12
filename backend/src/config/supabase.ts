import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Initialize the Supabase client only if an anon/service key is provided
export const supabase = env.SUPABASE_ANON_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    })
  : null;
