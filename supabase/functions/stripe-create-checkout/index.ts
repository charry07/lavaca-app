import Stripe from 'https://esm.sh/stripe@17?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, json } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Get user from JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing authorization' }, 401);

  const { data: { user }, error: authError } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  const { priceId, successUrl, cancelUrl } = await req.json();
  if (!priceId) return json({ error: 'priceId required' }, 400);

  // Get or create Stripe customer
  let stripeCustomerId: string;
  const { data: existing } = await sb
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    stripeCustomerId = existing.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({ metadata: { supabase_user_id: user.id } });
    stripeCustomerId = customer.id;
    await sb.from('stripe_customers').insert({ user_id: user.id, stripe_customer_id: customer.id });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl ?? 'https://lavaca.app/premium?success=true',
    cancel_url: cancelUrl ?? 'https://lavaca.app/premium?canceled=true',
    metadata: { user_id: user.id },
  });

  return json({ url: session.url, sessionId: session.id });
});
