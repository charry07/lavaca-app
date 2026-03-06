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
-- Insert/update only via service role (Edge Functions + Vercel webhook)
