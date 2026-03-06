import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(url: string, anonKey: string) {
  if (!url) throw new Error('Missing Supabase URL');
  if (!anonKey) throw new Error('Missing Supabase anon key');

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
