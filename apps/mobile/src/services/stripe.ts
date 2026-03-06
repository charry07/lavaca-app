import { Linking, Platform } from 'react-native';
import { createSupabaseClient } from '@lavaca/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const stripeService = {
  /**
   * Get the checkout URL from the Edge Function, then open it in the browser.
   * On mobile this opens the native browser. On web it redirects.
   */
  startCheckout: async (priceId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const successUrl = Platform.OS === 'web'
      ? `${window.location.origin}/premium?success=true`
      : 'lavacaapp://premium?success=true';
    const cancelUrl = Platform.OS === 'web'
      ? `${window.location.origin}/premium?canceled=true`
      : 'lavacaapp://premium?canceled=true';

    const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
      body: { priceId, successUrl, cancelUrl },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error || !data?.url) throw new Error(error?.message ?? 'Failed to create checkout session');

    if (Platform.OS === 'web') {
      window.location.href = data.url;
    } else {
      await Linking.openURL(data.url);
    }
  },

  /**
   * Check if the current user has an active subscription.
   */
  getSubscriptionStatus: async (userId: string): Promise<'active' | 'none'> => {
    if (!supabase) return 'none';
    const { data } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    return data ? 'active' : 'none';
  },
};
