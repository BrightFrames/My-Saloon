import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Dynamically construct Supabase URL from DB URL if not explicitly provided
let supabaseUrl = env.SUPABASE_URL;

if (!supabaseUrl && env.SUPABASE_DB_URL) {
  const match = env.SUPABASE_DB_URL.match(/postgres\.([a-z0-9]+)/i);
  if (match && match[1]) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

// Fallback placeholder URL to prevent Supabase SDK from crashing on startup
if (!supabaseUrl) {
  supabaseUrl = "https://placeholder-project-id.supabase.co";
}

// Check if anon key is a placeholder or not provided
const anonKey = env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY !== "your_supabase_anon_key_here"
  ? env.SUPABASE_ANON_KEY
  : "placeholder-anon-key";

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
  },
});
