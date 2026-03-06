import { useRef } from 'react';
import { createSupabaseClient } from '@lavaca/supabase';

type RealtimeTransport = { mode: 'supabase'; supabase: ReturnType<typeof createSupabaseClient> };

// Singleton — one realtime transport per app lifetime
let _transport: RealtimeTransport | null = null;

function getTransport(): RealtimeTransport {
  if (!_transport) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase env vars for realtime transport');
    }

    _transport = {
      mode: 'supabase',
      supabase: createSupabaseClient(supabaseUrl, supabaseAnonKey),
    };
  }

  return _transport;
}

export function useSocket(): RealtimeTransport {
  const transportRef = useRef<RealtimeTransport>(getTransport());

  return transportRef.current;
}
