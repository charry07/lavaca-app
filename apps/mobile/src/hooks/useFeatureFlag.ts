import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@lavaca/supabase';
import { useAuth } from '../auth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function useFeatureFlag(flag: string): boolean {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!user?.id || !supabase) {
      setEnabled(false);
      return;
    }
    supabase
      .from('feature_flags')
      .select('enabled')
      .eq('user_id', user.id)
      .eq('flag', flag)
      .maybeSingle()
      .then(({ data }) => setEnabled(data?.enabled ?? false));
  }, [user?.id, flag]);

  return enabled;
}
