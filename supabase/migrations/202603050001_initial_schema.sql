-- Initial Supabase schema for La Vaca
-- Generated from current SQLite domain model as migration baseline.

create table if not exists public.users (
  id text primary key,
  phone text unique not null,
  display_name text not null,
  username text unique not null,
  document_id text unique,
  avatar_url text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id text primary key,
  name text not null,
  icon text,
  created_by text not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id text not null references public.groups(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.sessions (
  id text primary key,
  join_code text unique not null,
  admin_id text not null references public.users(id),
  total_amount numeric not null,
  currency text not null default 'COP',
  split_mode text not null default 'equal',
  description text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.participants (
  join_code text not null references public.sessions(join_code) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  display_name text not null,
  amount numeric not null default 0,
  percentage numeric,
  status text not null default 'pending',
  payment_method text,
  is_roulette_winner boolean not null default false,
  is_roulette_coward boolean not null default false,
  joined_at timestamptz not null default now(),
  paid_at timestamptz,
  primary key (join_code, user_id)
);

create table if not exists public.feed_events (
  id text primary key,
  group_id text references public.groups(id) on delete set null,
  session_id text references public.sessions(id) on delete set null,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feed_event_users (
  event_id text not null references public.feed_events(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  primary key (event_id, user_id)
);

create index if not exists idx_sessions_admin_id on public.sessions(admin_id);
create index if not exists idx_participants_user_id on public.participants(user_id);
create index if not exists idx_participants_join_code on public.participants(join_code);
create index if not exists idx_feed_events_created_at on public.feed_events(created_at desc);
