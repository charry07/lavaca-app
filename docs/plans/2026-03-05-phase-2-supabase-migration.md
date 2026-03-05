# Phase 2 — Supabase Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Replace the entire Express + SQLite + Socket.IO backend with Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions).

**Architecture:** Create a `packages/supabase` workspace with the Supabase JS client and type helpers. Migrate all DB tables to PostgreSQL. Replace custom OTP with Supabase phone auth. Replace Socket.IO with Supabase Realtime. Replace base64 avatar storage with Supabase Storage. Migrate Express route logic to Edge Functions. Delete `apps/api` at the end.

**Tech Stack:** `@supabase/supabase-js` v2, Supabase CLI, PostgreSQL, Supabase Edge Functions (Deno), TypeScript.

**Conflict rules:** ONLY touch `packages/supabase/` (new), `apps/mobile/src/services/api.ts`, `apps/mobile/src/auth/AuthContext.tsx`, `apps/mobile/src/hooks/useSocket.ts`, `supabase/**` (new), `apps/api/**` (delete at end). NEVER touch UI screens or components.

Status: in-progress
Owner: AI Agent B

---

## PREREQUISITE — Manual steps (human required)

Before starting this phase, the project owner must:
1. Create a Supabase project at https://supabase.com
2. Provide `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. Enable phone auth in Supabase dashboard → Auth → Providers → Phone

See [2026-03-05-human-ops-checklist.md](./2026-03-05-human-ops-checklist.md) for full checklist.

---

## Task 1: Install Supabase CLI and initialize project structure

**Files:**
- Create: `supabase/config.toml` (auto-generated)
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Install Supabase CLI**
```bash
brew install supabase/tap/supabase
```

**Step 2: Initialize Supabase at repo root**
```bash
cd /path/to/lavaca-app
supabase init
```

**Step 3: Create `.env.local` with real values from Supabase dashboard**
```bash
cat > .env.local << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
EOF
```

**Step 4: Add `.env.local` to `.gitignore`**

Open `.gitignore` at repo root and add if not present:
```
.env.local
.env.*.local
```

**Step 5: Create `.env.example` for other developers**
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Step 6: Commit**
```bash
git add supabase/ .env.example .gitignore
git commit -m "feat(supabase): initialize Supabase CLI project"
```

---

## Task 2: Write PostgreSQL schema migration

**Files:**
- Create: `supabase/migrations/20260305000001_initial_schema.sql`

**Step 1: Create the migration file**

```sql
-- supabase/migrations/20260305000001_initial_schema.sql
create extension if not exists "uuid-ossp";

-- Users
create table public.users (
  id           text primary key default 'user-' || substr(md5(random()::text), 1, 8),
  phone        text unique not null,
  display_name text not null,
  username     text unique not null,
  document_id  text unique,
  avatar_url   text,
  email        text unique,
  created_at   timestamptz not null default now()
);

-- Sessions (mesas)
create table public.sessions (
  id           uuid primary key default uuid_generate_v4(),
  join_code    text unique not null,
  admin_id     text not null references public.users(id) on delete cascade,
  total_amount numeric(12,2) not null default 0,
  currency     text not null default 'COP',
  split_mode   text not null default 'equal' check (split_mode in ('equal','percentage','roulette')),
  description  text,
  status       text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at   timestamptz not null default now(),
  closed_at    timestamptz
);

-- Participants
create table public.participants (
  id                 uuid primary key default uuid_generate_v4(),
  join_code          text not null references public.sessions(join_code) on delete cascade,
  user_id            text references public.users(id) on delete set null,
  display_name       text not null,
  amount_owed        numeric(12,2) not null default 0,
  percentage         numeric(5,2),
  status             text not null default 'pending'
                       check (status in ('pending','reported','confirmed','rejected','failed')),
  is_roulette_winner boolean not null default false,
  is_roulette_coward boolean not null default false,
  joined_at          timestamptz not null default now(),
  paid_at            timestamptz,
  confirmed_at       timestamptz
);

-- Groups
create table public.groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  admin_id    text not null references public.users(id) on delete cascade,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   text not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Feed events
create table public.feed_events (
  id         uuid primary key default uuid_generate_v4(),
  join_code  text not null references public.sessions(join_code) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- OTPs
create table public.otps (
  phone      text primary key,
  code       text not null,
  expires_at timestamptz not null,
  verified   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_participants_join_code on public.participants(join_code);
create index idx_participants_user_id on public.participants(user_id);
create index idx_sessions_admin_id on public.sessions(admin_id);
create index idx_feed_events_join_code on public.feed_events(join_code);

-- Row Level Security
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.participants enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.feed_events enable row level security;
alter table public.otps enable row level security;

-- RLS policies
create policy "users_read_all"    on public.users for select using (true);
create policy "users_insert"      on public.users for insert with check (true);
create policy "users_update_own"  on public.users for update using (auth.uid()::text = id);
create policy "sessions_read_all" on public.sessions for select using (true);
create policy "sessions_insert"   on public.sessions for insert with check (true);
create policy "sessions_update"   on public.sessions for update using (auth.uid()::text = admin_id);
create policy "participants_read" on public.participants for select using (true);
create policy "participants_write" on public.participants for all using (true);
create policy "feed_read_all"     on public.feed_events for select using (true);
create policy "feed_insert"       on public.feed_events for insert with check (true);
create policy "groups_read_all"   on public.groups for select using (true);
create policy "groups_write"      on public.groups for all using (true);
create policy "members_read_all"  on public.group_members for select using (true);
create policy "members_write"     on public.group_members for all using (true);
```

**Step 2: Apply migration**
```bash
supabase db push
```
Expected: "Applying migration 20260305000001_initial_schema" with no errors.

**Step 3: Commit**
```bash
git add supabase/migrations/
git commit -m "feat(supabase): add initial PostgreSQL schema migration"
```

---

## Task 3: Add get_frequent_users SQL function

**Files:**
- Create: `supabase/migrations/20260305000002_frequent_users_fn.sql`

**Step 1: Create migration**
```sql
-- supabase/migrations/20260305000002_frequent_users_fn.sql
create or replace function get_frequent_users(p_user_id text, p_limit int default 7)
returns setof public.users
language sql
security definer
as $$
  select u.*
  from participants me
  inner join participants co on co.join_code = me.join_code and co.user_id <> me.user_id
  inner join users u on u.id = co.user_id
  where me.user_id = p_user_id
  group by u.id, u.phone, u.display_name, u.username,
           u.document_id, u.avatar_url, u.email, u.created_at
  order by count(*) desc, max(co.joined_at) desc
  limit p_limit;
$$;
```

**Step 2: Push and commit**
```bash
supabase db push
git add supabase/migrations/
git commit -m "feat(supabase): add get_frequent_users RPC function"
```

---

## Task 4: Create @lavaca/supabase workspace

**Files:**
- Create: `packages/supabase/package.json`
- Create: `packages/supabase/tsconfig.json`
- Create: `packages/supabase/src/client.ts`
- Create: `packages/supabase/src/types.ts`
- Create: `packages/supabase/src/index.ts`
- Modify: `pnpm-workspace.yaml`

**Step 1: Create `packages/supabase/package.json`**
```json
{
  "name": "@lavaca/supabase",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@supabase/supabase-js": "^2.48.0"
  },
  "devDependencies": {
    "typescript": "~5.9.2"
  }
}
```

**Step 2: Create `packages/supabase/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

Note: If `tsconfig.base.json` doesn't exist at root, create one:
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

**Step 3: Create `packages/supabase/src/client.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true },
});
```

**Step 4: Create `packages/supabase/src/types.ts`**
```typescript
// DB row shapes (snake_case from PostgreSQL)
export interface DbUser {
  id: string; phone: string; display_name: string; username: string;
  document_id?: string; avatar_url?: string; email?: string; created_at: string;
}
export interface DbSession {
  id: string; join_code: string; admin_id: string; total_amount: number;
  currency: string; split_mode: 'equal' | 'percentage' | 'roulette';
  description?: string; status: 'open' | 'closed' | 'cancelled';
  created_at: string; closed_at?: string;
}
export interface DbParticipant {
  id: string; join_code: string; user_id?: string; display_name: string;
  amount_owed: number; percentage?: number;
  status: 'pending' | 'reported' | 'confirmed' | 'rejected' | 'failed';
  is_roulette_winner: boolean; is_roulette_coward: boolean;
  joined_at: string; paid_at?: string; confirmed_at?: string;
}

// Mapper helpers: DB row → shared camelCase type
export function mapUser(row: DbUser) {
  return {
    id: row.id, phone: row.phone, displayName: row.display_name,
    username: row.username, documentId: row.document_id,
    avatarUrl: row.avatar_url, email: row.email,
    createdAt: new Date(row.created_at),
  };
}
export function mapSession(row: DbSession) {
  return {
    id: row.id, joinCode: row.join_code, adminId: row.admin_id,
    totalAmount: row.total_amount, currency: row.currency,
    splitMode: row.split_mode, description: row.description,
    status: row.status, createdAt: new Date(row.created_at),
    closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
  };
}
export function mapParticipant(row: DbParticipant) {
  return {
    id: row.id, joinCode: row.join_code, userId: row.user_id,
    displayName: row.display_name, amountOwed: row.amount_owed,
    percentage: row.percentage, status: row.status,
    isRouletteWinner: row.is_roulette_winner, isRouletteCoward: row.is_roulette_coward,
    joinedAt: new Date(row.joined_at),
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
  };
}
```

**Step 5: Create `packages/supabase/src/index.ts`**
```typescript
export { supabase } from './client';
export * from './types';
```

**Step 6: Add to `pnpm-workspace.yaml`**

Open `pnpm-workspace.yaml` and add `'packages/supabase'` to the packages list.

**Step 7: Install and typecheck**
```bash
pnpm install
pnpm --filter @lavaca/supabase typecheck
```

**Step 8: Commit**
```bash
git add packages/supabase/ pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(supabase): create @lavaca/supabase workspace"
```

---

## Task 5: Write Edge Functions

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/create-session/index.ts`
- Create: `supabase/functions/join-session/index.ts`
- Create: `supabase/functions/close-session/index.ts`
- Create: `supabase/functions/spin-roulette/index.ts`
- Create: `supabase/functions/approve-payment/index.ts`
- Create: `supabase/functions/report-paid/index.ts`

**Step 1: Create shared CORS helper**
```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return null;
}
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**Step 2: Create create-session edge function**
```typescript
// supabase/functions/create-session/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { adminId, totalAmount, currency, splitMode, description } = await req.json();
  if (!adminId || !totalAmount) return json({ error: 'adminId and totalAmount required' }, 400);
  const joinCode = 'VACA-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const { data, error } = await sb.from('sessions')
    .insert({ join_code: joinCode, admin_id: adminId, total_amount: totalAmount,
              currency: currency ?? 'COP', split_mode: splitMode ?? 'equal', description })
    .select().single();
  return error ? json({ error: error.message }, 500) : json(data);
});
```

**Step 3: Create close-session edge function**
```typescript
// supabase/functions/close-session/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { joinCode, adminId } = await req.json();
  const { data: session } = await sb.from('sessions').select('admin_id').eq('join_code', joinCode).single();
  if (!session || session.admin_id !== adminId) return json({ error: 'Unauthorized' }, 403);
  const { data, error } = await sb.from('sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('join_code', joinCode).select().single();
  return error ? json({ error: error.message }, 500) : json(data);
});
```

**Step 4: Create spin-roulette edge function**
```typescript
// supabase/functions/spin-roulette/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { joinCode } = await req.json();
  const { data: participants } = await sb.from('participants')
    .select('id, user_id, display_name').eq('join_code', joinCode).eq('status', 'pending');
  if (!participants?.length) return json({ error: 'No pending participants' }, 400);
  const winner = participants[Math.floor(Math.random() * participants.length)];
  await sb.from('participants').update({ is_roulette_winner: true }).eq('id', winner.id);
  await sb.from('participants').update({ status: 'confirmed' }).eq('join_code', joinCode).neq('id', winner.id);
  await sb.from('feed_events').insert({ join_code: joinCode, type: 'roulette_winner',
    payload: { winnerId: winner.user_id, winnerName: winner.display_name } });
  return json({ winner });
});
```

**Step 5: Deploy all functions**
```bash
supabase functions deploy create-session --no-verify-jwt
supabase functions deploy close-session
supabase functions deploy spin-roulette
supabase functions deploy join-session
supabase functions deploy approve-payment
supabase functions deploy report-paid
```

Expected: each shows "Deployed Function <name>" with no errors.

**Step 6: Commit**
```bash
git add supabase/functions/
git commit -m "feat(supabase): add Edge Functions for session management"
```

---

## Task 6: Migrate AuthContext to Supabase Auth

**Files:**
- Modify: `apps/mobile/src/auth/AuthContext.tsx`
- Modify: `apps/mobile/package.json`

**Step 1: Add @lavaca/supabase to mobile**

In `apps/mobile/package.json` dependencies:
```json
"@lavaca/supabase": "workspace:*"
```

**Step 2: Run install**
```bash
pnpm install
```

**Step 3: Read the current AuthContext.tsx fully**

Open `apps/mobile/src/auth/AuthContext.tsx` and understand the exported interface (user, sendOtp, verifyOtp, resendOtp, logout, updateProfile, deleteAccount).

**Step 4: Replace internals keeping the same interface**

Key replacements:
```typescript
import { supabase, mapUser } from '@lavaca/supabase';

// sendOtp → supabase.auth.signInWithOtp
const sendOtp = async (phone: string) => {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
};

// verifyOtp → supabase.auth.verifyOtp
const verifyOtp = async (phone: string, code: string) => {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
  if (error) throw error;
  // user profile upsert in public.users
  if (data.user) {
    await supabase.from('users').upsert({ id: data.user.id, phone });
  }
};

// logout → supabase.auth.signOut
const logout = async () => { await supabase.auth.signOut(); };

// Subscribe to auth changes
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(data ? mapUser(data) : null);
    } else {
      setUser(null);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

**Step 5: Typecheck**
```bash
pnpm --filter @lavaca/mobile typecheck
```
Expected: zero errors.

**Step 6: Commit**
```bash
git add apps/mobile/src/auth/AuthContext.tsx apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(auth): migrate AuthContext to Supabase phone OTP"
```

---

## Task 7: Migrate api.ts to Supabase client

**Files:**
- Modify: `apps/mobile/src/services/api.ts`

**Step 1: Read the current api.ts fully**

**Step 2: Replace all fetch calls**

```typescript
import { supabase, mapUser, mapSession, mapParticipant } from '@lavaca/supabase';
import type { User, PaymentSession } from '@lavaca/shared';

export const api = {
  // Sessions
  createSession: async (body: { adminId: string; totalAmount: number; currency: string; splitMode: string; description?: string }) => {
    const { data, error } = await supabase.functions.invoke('create-session', { body });
    if (error) throw error;
    return mapSession(data);
  },
  getSession: async (joinCode: string) => {
    const { data, error } = await supabase
      .from('sessions').select('*, participants(*)').eq('join_code', joinCode).single();
    if (error) throw error;
    return { ...mapSession(data), participants: (data.participants ?? []).map(mapParticipant) };
  },
  getMySessions: async (userId: string) => {
    const { data, error } = await supabase
      .from('sessions').select('*, participants(*)').eq('admin_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((s) => ({ ...mapSession(s), participants: (s.participants ?? []).map(mapParticipant) }));
  },
  closeSession: async (joinCode: string, adminId: string) => {
    const { data, error } = await supabase.functions.invoke('close-session', { body: { joinCode, adminId } });
    if (error) throw error;
    return data;
  },
  joinSession: async (joinCode: string, body: { userId: string; displayName: string }) => {
    const { data, error } = await supabase.functions.invoke('join-session', { body: { joinCode, ...body } });
    if (error) throw error;
    return data;
  },
  spinRoulette: async (joinCode: string) => {
    const { data, error } = await supabase.functions.invoke('spin-roulette', { body: { joinCode } });
    if (error) throw error;
    return data;
  },
  reportPaid: async (joinCode: string, participantId: string) => {
    const { data, error } = await supabase.functions.invoke('report-paid', { body: { joinCode, participantId } });
    if (error) throw error;
    return data;
  },
  approvePaid: async (joinCode: string, participantId: string) => {
    const { data, error } = await supabase.functions.invoke('approve-payment', { body: { joinCode, participantId } });
    if (error) throw error;
    return data;
  },
  // Users
  searchUsers: async (q: string) => {
    const { data, error } = await supabase.from('users')
      .select('id, display_name, username, phone, avatar_url, created_at')
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(20);
    if (error) throw error;
    return (data ?? []).map(mapUser);
  },
  getFrequentUsers: async (userId: string, limit = 7): Promise<User[]> => {
    const { data, error } = await supabase.rpc('get_frequent_users', { p_user_id: userId, p_limit: limit });
    if (error) throw error;
    return (data ?? []).map(mapUser);
  },
  getRandomUsers: async (limit: number, excludeIds: string[]): Promise<User[]> => {
    let query = supabase.from('users')
      .select('id, display_name, username, phone, avatar_url, created_at').limit(limit);
    if (excludeIds.length > 0) query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapUser);
  },
  updateProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    let avatarUrl = updates.avatarUrl;
    if (avatarUrl?.startsWith('data:image/')) {
      const [meta, base64Data] = avatarUrl.split(',');
      const mimeType = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      const blob = await fetch(avatarUrl).then((r) => r.blob());
      const filename = `${userId}/${Date.now()}.jpg`;
      await supabase.storage.from('avatars').upload(filename, blob, { contentType: mimeType, upsert: true });
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
      avatarUrl = urlData.publicUrl;
    }
    const { data, error } = await supabase.from('users')
      .update({ display_name: updates.displayName, username: updates.username, avatar_url: avatarUrl })
      .eq('id', userId).select().single();
    if (error) throw error;
    return mapUser(data);
  },
  // Feed
  getFeed: async (userId: string) => {
    const { data, error } = await supabase.from('feed_events')
      .select('*, sessions!inner(admin_id)').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data ?? [];
  },
  // Groups
  getMyGroups: async (userId: string) => {
    const { data, error } = await supabase.from('group_members')
      .select('groups(*)').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((d: any) => d.groups).filter(Boolean);
  },
};
```

**Step 3: Typecheck**
```bash
pnpm --filter @lavaca/mobile typecheck
```

**Step 4: Commit**
```bash
git add apps/mobile/src/services/api.ts
git commit -m "feat(api): migrate all API calls to Supabase client"
```

---

## Task 8: Replace Socket.IO with Supabase Realtime

**Files:**
- Modify: `apps/mobile/src/hooks/useSessionSocket.ts` (or `useSocket.ts`)

**Step 1: Read the current hook file**

**Step 2: Replace Socket.IO with Supabase Realtime**
```typescript
import { useEffect } from 'react';
import { supabase } from '@lavaca/supabase';

export function useSessionSocket(joinCode: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!joinCode) return;
    const channel = supabase.channel(`session:${joinCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `join_code=eq.${joinCode}` }, () => onUpdate())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `join_code=eq.${joinCode}` }, () => onUpdate())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [joinCode]);
}
```

**Step 3: Remove socket.io-client from mobile**
```bash
pnpm --filter @lavaca/mobile remove socket.io-client
```

**Step 4: Remove `useSocket.ts` singleton if it only handled socket.io**

Delete `apps/mobile/src/hooks/useSocket.ts` if it only set up the Socket.IO singleton. Update any screen imports.

**Step 5: Typecheck + commit**
```bash
pnpm --filter @lavaca/mobile typecheck
git add apps/mobile/src/hooks/ apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(realtime): replace Socket.IO with Supabase Realtime"
```

---

## Task 9: Delete apps/api

**Step 1: Verify the mobile app works end-to-end**

Run the web version and test: login → create session → join → participant list → realtime update.
```bash
cd apps/mobile && npx expo start --web
```

**Step 2: Remove from workspace**

In `pnpm-workspace.yaml`, remove `'apps/api'`.

In root `package.json`, remove `dev:api`, `build:api` scripts and `@lavaca/api` workspace reference.

**Step 3: Delete the directory**
```bash
rm -rf apps/api
```

**Step 4: Final typecheck + lint**
```bash
pnpm install
pnpm typecheck
pnpm lint
```

**Step 5: Final commit**
```bash
git add -A
git commit -m "feat(supabase): phase 2 complete — Express API removed, fully on Supabase"
```

---

## Phase 2 Checklist

- [x] Create `packages/supabase` workspace scaffold
- [x] Create initial SQL migration under `supabase/migrations`
- [ ] Supabase CLI initialized, project linked, `.env.local` configured
- [ ] PostgreSQL schema pushed to Supabase
- [ ] `get_frequent_users` RPC function deployed
- [ ] `@lavaca/supabase` workspace with client + type mappers
- [ ] All Edge Functions deployed
- [ ] `AuthContext` uses Supabase phone OTP
- [ ] `api.ts` uses Supabase client (no fetch to localhost:3001)
- [ ] Socket.IO replaced with Supabase Realtime
- [ ] `apps/api` deleted
- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm lint` → 0 warnings
