import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Initialize the Supabase client only if anon key exists
export const supabase = env.SUPABASE_ANON_KEY
  ? createClient(env.SUPABASE_URL as string, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    })
  : null;
