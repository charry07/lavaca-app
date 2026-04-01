-- Payment Bank Details + Notifications System
-- Adds tables for payment accounts, notifications, notification settings, and reminder tracking

-- ============================================================================
-- 1. PAYMENT ACCOUNTS TABLE
-- ============================================================================
create table if not exists public.payment_accounts (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users(id) on delete cascade,
  method_type text not null check (method_type in ('nequi', 'daviplata', 'pse', 'transfiya', 'bank_account', 'cash', 'other')),
  account_holder_name text not null,
  bank_name text,
  account_number text,
  account_type text check (account_type in ('ahorros', 'corriente')),
  llave text,
  phone text,
  document_id text,
  notes text,
  is_preferred boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payment_accounts_user_id on public.payment_accounts(user_id);
create index idx_payment_accounts_user_preferred on public.payment_accounts(user_id, is_preferred) where is_preferred = true;
create index idx_payment_accounts_active on public.payment_accounts(user_id, is_active) where is_active = true;

-- Trigger: Only one preferred account per user
create or replace function ensure_single_preferred_account()
returns trigger as $$
begin
  if NEW.is_preferred = true then
    update public.payment_accounts
    set is_preferred = false
    where user_id = NEW.user_id
      and id != NEW.id
      and is_preferred = true;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_ensure_single_preferred_account
  before insert or update on public.payment_accounts
  for each row
  when (NEW.is_preferred = true)
  execute function ensure_single_preferred_account();

-- Trigger: Update updated_at on modification
create or replace function update_payment_account_timestamp()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_update_payment_account_timestamp
  before update on public.payment_accounts
  for each row
  execute function update_payment_account_timestamp();

-- ============================================================================
-- 2. NOTIFICATIONS TABLE
-- ============================================================================
create table if not exists public.notifications (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users(id) on delete cascade,
  type text not null check (type in ('debt_reminder', 'payment_received', 'payment_approved', 'payment_rejected', 'session_closed')),
  title text not null,
  body text not null,
  session_id text references public.sessions(id) on delete set null,
  join_code text references public.sessions(join_code) on delete set null,
  related_user_id text references public.users(id) on delete set null,
  amount numeric,
  currency text default 'COP',
  is_read boolean not null default false,
  is_dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index idx_notifications_user_id on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id, is_read) where is_read = false;
create index idx_notifications_session on public.notifications(session_id);

-- ============================================================================
-- 3. NOTIFICATION SETTINGS TABLE
-- ============================================================================
create table if not exists public.notification_settings (
  user_id text primary key references public.users(id) on delete cascade,
  reminders_enabled boolean not null default true,
  push_enabled boolean not null default true,
  auto_reminder_3d boolean not null default true,
  auto_reminder_7d boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger: Update updated_at on modification
create trigger trg_update_notification_settings_timestamp
  before update on public.notification_settings
  for each row
  execute function update_payment_account_timestamp();

-- ============================================================================
-- 4. REMINDER LOG TABLE
-- ============================================================================
create table if not exists public.reminder_log (
  id text primary key default gen_random_uuid()::text,
  session_id text not null references public.sessions(id) on delete cascade,
  join_code text not null references public.sessions(join_code) on delete cascade,
  creditor_id text not null references public.users(id) on delete cascade,
  debtor_id text not null references public.users(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('manual', 'auto_3d', 'auto_7d')),
  sent_at timestamptz not null default now()
);

create index idx_reminder_log_debtor on public.reminder_log(debtor_id, sent_at desc);
create index idx_reminder_log_session on public.reminder_log(join_code, debtor_id, sent_at desc);
create index idx_reminder_log_creditor on public.reminder_log(creditor_id, sent_at desc);

-- ============================================================================
-- 5. ADD EXPO PUSH TOKEN TO USERS TABLE
-- ============================================================================
alter table public.users add column if not exists expo_push_token text;
create index if not exists idx_users_push_token on public.users(expo_push_token) where expo_push_token is not null;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
alter table public.payment_accounts enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;
alter table public.reminder_log enable row level security;

-- Payment Accounts Policies
-- Users can manage their own accounts
create policy "Users can manage own payment accounts"
  on public.payment_accounts for all
  using (auth.uid() = user_id);

-- Users can read accounts of people they owe money to (creditors in same session)
create policy "Users can see accounts of creditors"
  on public.payment_accounts for select
  using (
    exists (
      select 1 from public.participants p1
      inner join public.participants p2 on p1.join_code = p2.join_code
      where p1.user_id = auth.uid()
        and p2.user_id = payment_accounts.user_id
        and p1.amount > 0
        and p2.status in ('pending', 'reported', 'confirmed')
    )
  );

-- Notifications Policies
-- Users can only see and update their own notifications
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Service role can insert notifications (for Edge Functions)
create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (true);

-- Notification Settings Policies
-- Users can manage their own settings
create policy "Users can manage own notification settings"
  on public.notification_settings for all
  using (auth.uid() = user_id);

-- Reminder Log Policies
-- Users can read reminder logs for sessions they're part of
create policy "Users can read reminder logs for their sessions"
  on public.reminder_log for select
  using (
    exists (
      select 1 from public.participants p
      where p.join_code = reminder_log.join_code
        and p.user_id = auth.uid()
    )
  );

-- Service role can insert reminder logs (for Edge Functions and API)
create policy "Service role can insert reminder logs"
  on public.reminder_log for insert
  with check (true);

-- ============================================================================
-- 7. HELPER FUNCTION: Create default notification settings for new users
-- ============================================================================
create or replace function create_default_notification_settings()
returns trigger as $$
begin
  insert into public.notification_settings (user_id)
  values (NEW.id)
  on conflict (user_id) do nothing;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_create_default_notification_settings
  after insert on public.users
  for each row
  execute function create_default_notification_settings();

-- ============================================================================
-- 8. HELPER FUNCTION: Auto-delete old notifications (retention: 30 days)
-- ============================================================================
create or replace function delete_old_notifications()
returns void as $$
begin
  delete from public.notifications
  where created_at < now() - interval '30 days'
    and is_dismissed = true;
end;
$$ language plpgsql;

-- Note: Call this periodically via cron or scheduled Edge Function

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
