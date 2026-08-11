import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://jkpmioffpsdcoitgghyo.supabase.co';

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcG1pb2ZmcHNkY29pdGdnaHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgwMzIsImV4cCI6MjEwMTc4NDAzMn0.PYNjYs_n-OHB9iqlcSTGSFQH9phGKalIpp4RfhONEK8';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
