# Phase 4 — Stripe Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Integrate Stripe for payments — add premium feature flags, a checkout flow, and webhook reconciliation. The business model is TBD, so this phase focuses on the infrastructure that any model can plug into.

**Architecture:** Supabase stores `stripe_customers` and `subscriptions` tables with RLS. A Supabase Edge Function creates Stripe Checkout Sessions. The Vercel Serverless Function handles Stripe webhook events and writes back to Supabase. The mobile app has a `premium.tsx` screen and a `useFeatureFlag()` hook. Feature flags live in Supabase and are checked client-side.

**Tech Stack:** Stripe JS SDK, Stripe Node SDK (server), `@stripe/stripe-react-native` (optional), Supabase Edge Functions, Vercel Serverless Functions.

**Conflict rules:** ONLY touch `supabase/migrations/` (new tables), `supabase/functions/stripe-*/` (new functions), `apps/vercel-functions/api/stripe-webhook.ts` (replace placeholder), `apps/mobile/app/(tabs)/premium.tsx` (new screen), `apps/mobile/src/services/stripe.ts` (new service), `apps/mobile/src/hooks/useFeatureFlag.ts` (new hook). NEVER touch existing screens except to add premium badge to profile.

**Depends on:** Phase 2 (Supabase) + Phase 3 (Vercel functions) complete.

Status: pending
Owner: AI Agent D

---

## PREREQUISITE — Manual steps (human required)

1. Stripe account with products/prices created
2. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` configured in Vercel + GitHub secrets
3. See [2026-03-05-human-ops-checklist.md](./2026-03-05-human-ops-checklist.md)

---

## Task 1: Add Stripe tables migration

**Files:**
- Create: `supabase/migrations/20260305000003_stripe_tables.sql`

**Step 1: Create migration**
```sql
-- supabase/migrations/20260305000003_stripe_tables.sql

-- Stripe customer mapping (one per user)
create table public.stripe_customers (
  user_id            text primary key references public.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at         timestamptz not null default now()
);

-- Subscriptions
create table public.subscriptions (
  id                     text primary key,  -- Stripe subscription ID
  user_id                text not null references public.users(id) on delete cascade,
  stripe_customer_id     text not null,
  status                 text not null,     -- active, canceled, past_due, trialing
  price_id               text not null,     -- Stripe price ID
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Feature flags per user
create table public.feature_flags (
  user_id     text not null references public.users(id) on delete cascade,
  flag        text not null,   -- e.g. 'premium', 'unlimited_history', 'analytics'
  enabled     boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, flag)
);

-- RLS
alter table public.stripe_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.feature_flags enable row level security;

create policy "stripe_customers_own" on public.stripe_customers for select using (auth.uid()::text = user_id);
create policy "subscriptions_own" on public.subscriptions for select using (auth.uid()::text = user_id);
create policy "feature_flags_own" on public.feature_flags for select using (auth.uid()::text = user_id);
-- Insert/update only via service role (Edge Functions)
```

**Step 2: Push migration**
```bash
supabase db push
```
Expected: "Applying migration 20260305000003_stripe_tables" with no errors.

**Step 3: Commit**
```bash
git add supabase/migrations/
git commit -m "feat(stripe): add stripe_customers, subscriptions, feature_flags tables"
```

---

## Task 2: Edge Function — create-checkout-session

**Files:**
- Create: `supabase/functions/stripe-create-checkout/index.ts`

**Step 1: Create the function**
```typescript
// supabase/functions/stripe-create-checkout/index.ts
import Stripe from 'https://esm.sh/stripe@17?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, json } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
  const { data: existing } = await sb.from('stripe_customers')
    .select('stripe_customer_id').eq('user_id', user.id).single();

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
```

**Step 2: Deploy**
```bash
supabase functions deploy stripe-create-checkout
```

**Step 3: Commit**
```bash
git add supabase/functions/stripe-create-checkout/
git commit -m "feat(stripe): add create-checkout-session Edge Function"
```

---

## Task 3: Vercel webhook handler (replace placeholder)

**Files:**
- Modify: `apps/vercel-functions/api/stripe-webhook.ts`

**Step 1: Read the current placeholder file**

**Step 2: Install Stripe in vercel-functions**

In `apps/vercel-functions/package.json`, verify `"stripe": "^17.0.0"` is in dependencies:
```bash
pnpm --filter @lavaca/vercel-functions add stripe
```

**Step 3: Replace placeholder with full implementation**
```typescript
// apps/vercel-functions/api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'] as string;
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.subscription && session.metadata?.user_id) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await sb.from('subscriptions').upsert({
          id: sub.id,
          user_id: session.metadata.user_id,
          stripe_customer_id: sub.customer as string,
          status: sub.status,
          price_id: sub.items.data[0]?.price.id,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        // Enable premium flag
        await sb.from('feature_flags').upsert({
          user_id: session.metadata.user_id,
          flag: 'premium',
          enabled: true,
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const { data: customer } = await sb.from('stripe_customers')
        .select('user_id').eq('stripe_customer_id', sub.customer as string).single();
      if (customer) {
        await sb.from('subscriptions').upsert({
          id: sub.id, user_id: customer.user_id,
          stripe_customer_id: sub.customer as string,
          status: sub.status,
          price_id: sub.items.data[0]?.price.id,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        // Disable premium if subscription ended
        if (sub.status === 'canceled' || sub.status === 'unpaid') {
          await sb.from('feature_flags').upsert({ user_id: customer.user_id, flag: 'premium', enabled: false });
        }
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
```

**Step 4: Add SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to Vercel env vars**

These are server-side only — do NOT use the `EXPO_PUBLIC_` prefix.

**Step 5: Typecheck + commit**
```bash
pnpm --filter @lavaca/vercel-functions typecheck
git add apps/vercel-functions/api/stripe-webhook.ts pnpm-lock.yaml
git commit -m "feat(stripe): implement Stripe webhook handler with subscription reconciliation"
```

---

## Task 4: Mobile Stripe service

**Files:**
- Create: `apps/mobile/src/services/stripe.ts`

**Step 1: Create the service**
```typescript
// apps/mobile/src/services/stripe.ts
import { supabase } from '@lavaca/supabase';
import { Linking, Platform } from 'react-native';

export const stripeService = {
  /**
   * Get the checkout URL from the Edge Function, then open it in the browser.
   * On mobile, this opens the native browser. On web, it redirects.
   */
  startCheckout: async (priceId: string): Promise<void> => {
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
    const { data } = await supabase.from('subscriptions')
      .select('status').eq('user_id', userId).eq('status', 'active').maybeSingle();
    return data ? 'active' : 'none';
  },
};
```

**Step 2: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/src/services/stripe.ts
git commit -m "feat(stripe): add mobile Stripe service for checkout"
```

---

## Task 5: useFeatureFlag hook

**Files:**
- Create: `apps/mobile/src/hooks/useFeatureFlag.ts`

**Step 1: Create the hook**
```typescript
// apps/mobile/src/hooks/useFeatureFlag.ts
import { useEffect, useState } from 'react';
import { supabase } from '@lavaca/supabase';
import { useAuth } from '../auth';

export function useFeatureFlag(flag: string): boolean {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!user?.id) { setEnabled(false); return; }
    supabase.from('feature_flags')
      .select('enabled').eq('user_id', user.id).eq('flag', flag).maybeSingle()
      .then(({ data }) => setEnabled(data?.enabled ?? false));
  }, [user?.id, flag]);

  return enabled;
}
```

**Step 2: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/src/hooks/useFeatureFlag.ts
git commit -m "feat(stripe): add useFeatureFlag hook"
```

---

## Task 6: Premium screen

**Files:**
- Create: `apps/mobile/app/(tabs)/premium.tsx`
- Modify: `apps/mobile/src/i18n/translations.ts`

**Step 1: Add i18n strings to all 3 locales**

In `apps/mobile/src/i18n/translations.ts`, add to es/en/pt:
```
// es
'premium.title': 'La Vaca Pro',
'premium.subtitle': 'Desbloquea funciones avanzadas',
'premium.cta': 'Suscribirse',
'premium.manage': 'Gestionar suscripción',
'premium.active': '✓ Suscripción activa',
'premium.feature.unlimited': 'Historial ilimitado',
'premium.feature.analytics': 'Análisis de gastos',
'premium.feature.groups': 'Grupos avanzados',

// en
'premium.title': 'La Vaca Pro',
'premium.subtitle': 'Unlock advanced features',
'premium.cta': 'Subscribe',
'premium.manage': 'Manage subscription',
'premium.active': '✓ Active subscription',
'premium.feature.unlimited': 'Unlimited history',
'premium.feature.analytics': 'Spending analytics',
'premium.feature.groups': 'Advanced groups',

// pt
'premium.title': 'La Vaca Pro',
'premium.subtitle': 'Desbloqueie recursos avançados',
'premium.cta': 'Assinar',
'premium.manage': 'Gerenciar assinatura',
'premium.active': '✓ Assinatura ativa',
'premium.feature.unlimited': 'Histórico ilimitado',
'premium.feature.analytics': 'Análise de gastos',
'premium.feature.groups': 'Grupos avançados',
```

**Step 2: Create the premium screen**
```typescript
// apps/mobile/app/(tabs)/premium.tsx
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth';
import { useFeatureFlag } from '../../src/hooks/useFeatureFlag';
import { stripeService } from '../../src/services/stripe';
import { useToast } from '../../src/components/Toast';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../../src/constants/theme';
import { useState } from 'react';

const PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_ID ?? 'price_placeholder';

const FEATURES = [
  { key: 'premium.feature.unlimited', icon: '📋' },
  { key: 'premium.feature.analytics', icon: '📊' },
  { key: 'premium.feature.groups', icon: '👥' },
] as const;

export default function PremiumScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const { showError } = useToast();
  const isPremium = useFeatureFlag('premium');
  const [loading, setLoading] = useState(false);
  const s = createStyles(colors);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await stripeService.startCheckout(PRICE_ID);
    } catch (err: any) {
      showError(err.message ?? 'Error al iniciar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      {/* Header */}
      <LinearGradient colors={[colors.accent + '30', colors.background]} style={s.hero}>
        <Text style={s.heroEmoji}>🐄✨</Text>
        <Text style={s.heroTitle}>{t('premium.title')}</Text>
        <Text style={s.heroSubtitle}>{t('premium.subtitle')}</Text>
      </LinearGradient>

      {/* Features */}
      <View style={s.features}>
        {FEATURES.map((f) => (
          <View key={f.key} style={s.featureRow}>
            <Text style={s.featureIcon}>{f.icon}</Text>
            <Text style={s.featureLabel}>{t(f.key)}</Text>
            <Text style={s.featureCheck}>✓</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      {isPremium ? (
        <View style={s.activeCard}>
          <Text style={s.activeText}>{t('premium.active')}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[s.ctaWrap, loading && { opacity: 0.6 }]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[colors.accent, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
            <Text style={s.ctaText}>{loading ? '...' : t('premium.cta')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    hero: { borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
    heroEmoji: { fontSize: 48, marginBottom: spacing.sm },
    heroTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
    heroSubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
    features: { gap: spacing.sm, marginBottom: spacing.xl },
    featureRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: colors.surface2, borderRadius: borderRadius.md,
      padding: spacing.md, borderWidth: 1, borderColor: colors.surfaceBorder,
    },
    featureIcon: { fontSize: 22 },
    featureLabel: { flex: 1, fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
    featureCheck: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.bold },
    ctaWrap: { borderRadius: borderRadius.md, overflow: 'hidden' },
    cta: { paddingVertical: spacing.md + 4, alignItems: 'center', borderRadius: borderRadius.md },
    ctaText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.background, letterSpacing: 0.3 },
    activeCard: {
      backgroundColor: colors.primary + '14', borderRadius: borderRadius.md,
      padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '40',
    },
    activeText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.primary },
  });
```

**Step 3: Add EXPO_PUBLIC_STRIPE_PRICE_ID to .env.example**

Open `.env.example` and add:
```
EXPO_PUBLIC_STRIPE_PRICE_ID=price_your_plan_id
```

**Step 4: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/app/(tabs)/premium.tsx apps/mobile/src/i18n/translations.ts .env.example
git commit -m "feat(stripe): add premium screen with Stripe checkout"
```

---

## Task 7: Add premium badge to Profile screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

**Step 1: Read the current profile.tsx**

**Step 2: Add premium badge**

Import and use the hook:
```typescript
import { useFeatureFlag } from '../../src/hooks/useFeatureFlag';
const isPremium = useFeatureFlag('premium');
```

Add a small badge near the username:
```tsx
{isPremium && (
  <View style={s.premiumBadge}>
    <Text style={s.premiumBadgeText}>✨ Pro</Text>
  </View>
)}
```

Add styles:
```typescript
premiumBadge: {
  backgroundColor: colors.accent + '20',
  borderRadius: borderRadius.full,
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
  borderWidth: 1,
  borderColor: colors.accent + '60',
  alignSelf: 'flex-start',
},
premiumBadgeText: {
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  color: colors.accent,
},
```

**Step 3: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/app/(tabs)/profile.tsx
git commit -m "feat(stripe): add premium badge to profile screen"
```

---

## Task 8: End-to-end test in Stripe test mode

**Step 1: Ensure test mode keys are set**

Verify `.env.local` has `STRIPE_SECRET_KEY=sk_test_...` and `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`.

**Step 2: Start the app and test flow**
```bash
cd apps/mobile && npx expo start --web
```

1. Log in
2. Navigate to Premium tab
3. Tap "Subscribe"
4. Stripe test checkout opens — use card `4242 4242 4242 4242`, any future expiry, any CVC
5. Complete payment
6. Verify Vercel webhook log shows `checkout.session.completed` received
7. Check Supabase `subscriptions` table has a new row with `status: 'active'`
8. Check `feature_flags` table has `premium: true` for the user
9. Navigate back to app — Premium tab should show "✓ Active subscription"
10. Profile should show "✨ Pro" badge

**Step 3: Final commit**
```bash
git add -A
git commit -m "feat(stripe): phase 4 complete — Stripe integration with webhooks and premium UI"
```

---

## Phase 4 Checklist

- [ ] Stripe tables migration (`stripe_customers`, `subscriptions`, `feature_flags`) pushed
- [ ] `stripe-create-checkout` Edge Function deployed
- [ ] Vercel webhook handler replaces placeholder and handles subscription events
- [ ] `stripeService` mobile service created
- [ ] `useFeatureFlag` hook created
- [ ] `premium.tsx` screen with checkout CTA + active state
- [ ] Premium badge on profile screen
- [ ] End-to-end test in Stripe test mode passes
- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm lint` → 0 warnings
