import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://wmbhccpphizxtixerubk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYmhjY3BwaGl6eHRpeGVydWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjI4NzQsImV4cCI6MjA5MTI5ODg3NH0.IABkEaTjpMe1XPJA7RAdUPBHaC2WUZY73F3Avz5QsJc";

const isSupabaseConfigured =
  !supabaseUrl.includes("YOUR_PROJECT_ID") &&
  !supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY");

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add your project URL and anon key in supabase.js.");
  }

  return supabase;
};

export { supabase, isSupabaseConfigured, requireSupabase };
