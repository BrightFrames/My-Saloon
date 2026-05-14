import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Initialize the Supabase client (v2 requires both URL and anon key)
export const supabase = createClient(
	env.SUPABASE_URL as string,
	env.SUPABASE_ANON_KEY as string
);
