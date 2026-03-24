import {
  FeedEvent,
  formatCOP,
  generateJoinCode,
  Group,
  Participant,
  PaymentSession,
  SplitMode,
  splitByPercentage,
  splitEqual,
  User,
} from '@lavaca/types';
import { createSupabaseClient } from '@lavaca/api';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DEV_MOCK = process.env.EXPO_PUBLIC_DEV_MOCK === 'true';

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const isSupabaseEnabled = !!supabase;
const SUPABASE_REQUIRED_ERROR = 'Supabase is required. Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';

// ── Dev mock data ─────────────────────────────────────
const MOCK_USER: User = {
  id: 'dev-user-001',
  phone: '+57000000000',
  displayName: 'Dev User',
  username: 'devuser',
  documentId: '12345678',
  createdAt: new Date(),
};

const MOCK_DEV_CODE = '123456';

type UserRow = {
  id: string;
  phone: string;
  displayName?: string;
  display_name?: string;
  username: string;
  documentId?: string | null;
  document_id?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  createdAt?: string;
  created_at?: string;
};

type ParticipantRow = {
  join_code: string;
  user_id: string;
  display_name: string;
  amount: number;
  percentage?: number | null;
  status: Participant['status'];
  payment_method?: string | null;
  is_roulette_winner?: boolean;
  is_roulette_coward?: boolean;
  joined_at: string;
  paid_at?: string | null;
};

type SessionRow = {
  id: string;
  join_code: string;
  admin_id: string;
  total_amount: number;
  currency: string;
  split_mode: SplitMode;
  description?: string | null;
  status: PaymentSession['status'];
  created_at: string;
  closed_at?: string | null;
};

type GroupRow = {
  id: string;
  name: string;
  icon?: string | null;
  created_by: string;
  created_at: string;
};

type FeedEventRow = {
  id: string;
  group_id?: string | null;
  session_id?: string | null;
  type: FeedEvent['type'];
  message: string;
  created_at: string;
};

interface OTPSendResponse {
  success: boolean;
  message: string;
  dev_code: string;
}

interface OTPVerifyResponse {
  verified: boolean;
  isRegistered: boolean;
  user: User | null;
}

function throwWithFallback(message: string, fallback = 'Unknown error'): never {
  throw new Error(message || fallback);
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}`;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    phone: row.phone,
    displayName: row.displayName ?? row.display_name ?? '',
    username: row.username,
    documentId: row.documentId ?? row.document_id ?? undefined,
    avatarUrl: row.avatarUrl ?? row.avatar_url ?? undefined,
    email: row.email ?? undefined,
    createdAt: new Date(row.createdAt ?? row.created_at ?? Date.now()),
  };
}

function rowToParticipant(row: ParticipantRow): Participant {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    amount: Number(row.amount || 0),
    percentage: row.percentage ?? undefined,
    status: row.status,
    paymentMethod: (row.payment_method ?? undefined) as Participant['paymentMethod'],
    isRouletteWinner: !!row.is_roulette_winner,
    isRouletteCoward: !!row.is_roulette_coward,
    joinedAt: new Date(row.joined_at),
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
  };
}

function rowToSession(row: SessionRow, participants: Participant[]): PaymentSession {
  return {
    id: row.id,
    joinCode: row.join_code,
    adminId: row.admin_id,
    totalAmount: Number(row.total_amount || 0),
    currency: row.currency,
    splitMode: row.split_mode,
    participants,
    status: row.status,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at),
    closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
  };
}

function rowToGroup(row: GroupRow, memberIds: string[]): Group {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    memberIds,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  };
}

function rowToFeedEvent(row: FeedEventRow, userIds: string[]): FeedEvent {
  return {
    id: row.id,
    groupId: row.group_id ?? undefined,
    sessionId: row.session_id ?? undefined,
    type: row.type,
    message: row.message,
    userIds,
    createdAt: new Date(row.created_at),
  };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

async function getSessionFromSupabase(joinCode: string): Promise<PaymentSession> {
  if (!supabase) throw new Error('Supabase disabled');

  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('join_code', joinCode)
    .single<SessionRow>();

  if (sessionErr || !session) throwWithFallback(sessionErr?.message || 'Session not found');

  const { data: participantRows, error: participantErr } = await supabase
    .from('participants')
    .select('*')
    .eq('join_code', joinCode);

  if (participantErr) throwWithFallback(participantErr.message, 'Could not load participants');

  const participants = ((participantRows || []) as ParticipantRow[]).map(rowToParticipant);
  return rowToSession(session, participants);
}

async function closeSessionIfAllPaid(session: PaymentSession): Promise<void> {
  if (!supabase) return;

  const owed = session.participants.filter((p) => p.amount > 0);
  const allPaid = owed.length > 0 && owed.every((p) => p.status === 'confirmed');
  if (!allPaid) return;

  await supabase
    .from('sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('join_code', session.joinCode);
}

async function getEventUserIds(eventId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('feed_event_users')
    .select('user_id')
    .eq('event_id', eventId);

  if (error) return [];
  return ((data || []) as { user_id: string }[]).map((r) => r.user_id);
}

async function getGroupMembersDetailed(groupId: string): Promise<{ id: string; displayName: string; username: string; avatarUrl?: string; phone?: string }[]> {
  if (!supabase) return [];

  const { data: memberRows, error: memberErr } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  if (memberErr) throwWithFallback(memberErr.message, 'Could not load group members');

  const memberIds = unique(((memberRows || []) as { user_id: string }[]).map((r) => r.user_id));
  if (memberIds.length === 0) return [];

  const { data: userRows, error: userErr } = await supabase
    .from('users')
    .select('*')
    .in('id', memberIds);

  if (userErr) throwWithFallback(userErr.message, 'Could not load users');

  return ((userRows || []) as UserRow[]).map((u) => ({
    id: u.id,
    displayName: u.displayName ?? u.display_name ?? '',
    username: u.username,
    avatarUrl: u.avatarUrl ?? u.avatar_url ?? undefined,
    phone: u.phone,
  }));
}

export const api = {
  isSupabaseEnabled: () => isSupabaseEnabled,

  // ── OTP / Auth ────────────────────────────────────────
  sendOTP: async (phone: string) => {
    if (DEV_MOCK) {
      return { success: true, message: 'Dev OTP sent', dev_code: MOCK_DEV_CODE } satisfies OTPSendResponse;
    }
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throwWithFallback(error.message, 'Could not send OTP');
      return { success: true, message: 'OTP sent', dev_code: '' } satisfies OTPSendResponse;
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  resendOTP: async (phone: string) => {
    if (DEV_MOCK) {
      return { success: true, message: 'Dev OTP resent', dev_code: MOCK_DEV_CODE } satisfies OTPSendResponse;
    }
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throwWithFallback(error.message, 'Could not resend OTP');
      return { success: true, message: 'OTP resent', dev_code: '' } satisfies OTPSendResponse;
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  verifyOTP: async (phone: string, code: string) => {
    if (DEV_MOCK) {
      if (code !== MOCK_DEV_CODE) throwWithFallback('Wrong dev code. Use ' + MOCK_DEV_CODE);
      const mockUser = { ...MOCK_USER, phone };
      return { verified: true, isRegistered: true, user: mockUser } satisfies OTPVerifyResponse;
    }
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) throwWithFallback(error.message, 'Invalid OTP code');

      const { data: authUserData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !authUserData.user) {
        throwWithFallback(userErr?.message || 'Unable to load authenticated user');
      }

      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserData.user.id)
        .maybeSingle<UserRow>();

      if (profileErr) throwWithFallback(profileErr.message, 'Could not verify user profile');
      if (!profile) return { verified: true, isRegistered: false, user: null } satisfies OTPVerifyResponse;

      return { verified: true, isRegistered: true, user: rowToUser(profile) } satisfies OTPVerifyResponse;
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  register: async (data: { phone: string; displayName: string; username: string; documentId: string }) => {
    if (DEV_MOCK) {
      return { ...MOCK_USER, phone: data.phone, displayName: data.displayName, username: data.username, documentId: data.documentId };
    }
    if (supabase) {
      const { data: authUserData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUserData.user) {
        throwWithFallback(authErr?.message || 'Missing authenticated session for registration');
      }

      const payload = {
        id: authUserData.user.id,
        phone: data.phone,
        display_name: data.displayName.trim(),
        username: data.username.trim().toLowerCase(),
        document_id: data.documentId.trim(),
      };

      const { error: insertErr } = await supabase.from('users').upsert(payload);
      if (insertErr) throwWithFallback(insertErr.message, 'Could not register user');

      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserData.user.id)
        .single<UserRow>();

      if (profileErr || !profile) throwWithFallback(profileErr?.message || 'Could not load registered user');
      return rowToUser(profile);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  login: async (_phone: string) => {
    if (DEV_MOCK) return MOCK_USER;
    if (supabase) {
      const { data: authUserData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUserData.user) {
        throwWithFallback('Use OTP verification to sign in', 'No active Supabase session');
      }

      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserData.user.id)
        .maybeSingle<UserRow>();

      if (profileErr) throwWithFallback(profileErr.message, 'Could not load profile');
      if (!profile) throwWithFallback('User not found. Please complete registration first.');
      return rowToUser(profile);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  getUser: async (userId: string) => {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single<UserRow>();
      if (error || !data) throwWithFallback(error?.message || 'User not found');
      return rowToUser(data);
    }
    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  updateUser: async (userId: string, data: { displayName?: string; username?: string; documentId?: string; avatarUrl?: string }) => {
    if (supabase) {
      const updatePayload: Record<string, string | null | undefined> = {
        display_name: data.displayName,
        username: data.username?.trim().toLowerCase(),
        document_id: data.documentId,
        avatar_url: data.avatarUrl,
      };

      const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);
      if (error) throwWithFallback(error.message, 'Could not update profile');

      const { data: updated, error: getErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single<UserRow>();

      if (getErr || !updated) throwWithFallback(getErr?.message || 'Could not load updated profile');
      return rowToUser(updated);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  deleteUser: async (userId: string) => {
    if (supabase) {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throwWithFallback(error.message, 'Could not delete user');
      await supabase.auth.signOut();
      return { success: true };
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  logout: async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throwWithFallback(error.message, 'Could not logout');
    }
  },

  searchUsers: async (query: string) => {
    if (supabase) {
      const q = query.trim();
      if (q.length < 2) return [];

      const pattern = `%${q}%`;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`display_name.ilike.${pattern},username.ilike.${pattern},phone.ilike.${pattern},document_id.ilike.${pattern},email.ilike.${pattern}`)
        .limit(20);

      if (error) throwWithFallback(error.message, 'Could not search users');
      return ((data || []) as UserRow[]).map(rowToUser);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  lookupByPhones: async (phones: string[]) => {
    if (supabase) {
      if (!phones.length) return [];
      const { data, error } = await supabase.from('users').select('*').in('phone', phones);
      if (error) throwWithFallback(error.message, 'Could not lookup contacts');
      return ((data || []) as UserRow[]).map(rowToUser);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  getUserHistory: async (userId: string) => {
    if (supabase) {
      const { data: adminRows, error: adminErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('admin_id', userId)
        .order('created_at', { ascending: false });
      if (adminErr) throwWithFallback(adminErr.message, 'Could not load user sessions');

      const { data: participantRows, error: participantErr } = await supabase
        .from('participants')
        .select('join_code')
        .eq('user_id', userId);
      if (participantErr) throwWithFallback(participantErr.message, 'Could not load participant sessions');

      const participantJoinCodes = unique(((participantRows || []) as { join_code: string }[]).map((r) => r.join_code));
      let participantSessions: SessionRow[] = [];
      if (participantJoinCodes.length > 0) {
        const { data: sessionRows, error: sessionErr } = await supabase
          .from('sessions')
          .select('*')
          .in('join_code', participantJoinCodes)
          .order('created_at', { ascending: false });
        if (sessionErr) throwWithFallback(sessionErr.message, 'Could not load history sessions');
        participantSessions = (sessionRows || []) as SessionRow[];
      }

      const byJoin = new Map<string, SessionRow>();
      ([...((adminRows || []) as SessionRow[]), ...participantSessions]).forEach((row) => byJoin.set(row.join_code, row));

      const sessions: PaymentSession[] = [];
      for (const row of byJoin.values()) {
        const { data: pRows, error: pErr } = await supabase
          .from('participants')
          .select('*')
          .eq('join_code', row.join_code);
        if (pErr) throwWithFallback(pErr.message, 'Could not load session participants');
        sessions.push(rowToSession(row, ((pRows || []) as ParticipantRow[]).map(rowToParticipant)));
      }

      return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  getFrequentUsers: async (userId: string, limit = 7) => {
    if (supabase) {
      const { data: myParticipation, error: myErr } = await supabase
        .from('participants')
        .select('join_code')
        .eq('user_id', userId);
      if (myErr) throwWithFallback(myErr.message, 'Could not load frequent users');

      const joinCodes = unique(((myParticipation || []) as { join_code: string }[]).map((r) => r.join_code));
      if (joinCodes.length === 0) return [];

      const { data: others, error: otherErr } = await supabase
        .from('participants')
        .select('user_id, joined_at')
        .in('join_code', joinCodes)
        .neq('user_id', userId);
      if (otherErr) throwWithFallback(otherErr.message, 'Could not load participant frequencies');

      const counts = new Map<string, { count: number; latest: number }>();
      ((others || []) as { user_id: string; joined_at: string }[]).forEach((row) => {
        const prev = counts.get(row.user_id) || { count: 0, latest: 0 };
        const ts = new Date(row.joined_at).getTime();
        counts.set(row.user_id, { count: prev.count + 1, latest: Math.max(prev.latest, ts) });
      });

      const topIds = [...counts.entries()]
        .sort((a, b) => b[1].count - a[1].count || b[1].latest - a[1].latest)
        .slice(0, limit)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data: users, error: userErr } = await supabase.from('users').select('*').in('id', topIds);
      if (userErr) throwWithFallback(userErr.message, 'Could not load frequent users');

      const userMap = new Map(((users || []) as UserRow[]).map((u) => [u.id, rowToUser(u)]));
      return topIds.map((id) => userMap.get(id)).filter((u): u is User => !!u);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  getRandomUsers: async (limit: number, excludeIds: string[]) => {
    if (supabase) {
      const exclude = unique(excludeIds.filter(Boolean));
      const { data, error } = exclude.length
        ? await supabase.from('users').select('*').not('id', 'in', `(${exclude.join(',')})`)
        : await supabase.from('users').select('*');

      if (error) throwWithFallback(error.message, 'Could not load random users');
      return shuffle(((data || []) as UserRow[]).map(rowToUser)).slice(0, limit);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  // ── Feed ──────────────────────────────────────────────
  getFeed: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('feed_events').select('*').order('created_at', { ascending: false });
      if (error) throwWithFallback(error.message, 'Could not load feed');

      const events = (data || []) as FeedEventRow[];
      const mapped: FeedEvent[] = [];
      for (const event of events) {
        const userIds = await getEventUserIds(event.id);
        mapped.push(rowToFeedEvent(event, userIds));
      }
      return mapped;
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  getUserFeed: async (userId: string) => {
    if (supabase) {
      const { data: links, error: linkErr } = await supabase
        .from('feed_event_users')
        .select('event_id')
        .eq('user_id', userId);
      if (linkErr) throwWithFallback(linkErr.message, 'Could not load user feed');

      const eventIds = unique(((links || []) as { event_id: string }[]).map((r) => r.event_id));
      if (eventIds.length === 0) return [];

      const { data: events, error: eventErr } = await supabase
        .from('feed_events')
        .select('*')
        .in('id', eventIds)
        .order('created_at', { ascending: false });
      if (eventErr) throwWithFallback(eventErr.message, 'Could not load feed events');

      const mapped: FeedEvent[] = [];
      for (const event of (events || []) as FeedEventRow[]) {
        const userIds = await getEventUserIds(event.id);
        mapped.push(rowToFeedEvent(event, userIds));
      }
      return mapped;
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  // ── Groups ────────────────────────────────────────────
  createGroup: async (data: { name: string; icon?: string; memberIds?: string[]; createdBy: string }) => {
    if (supabase) {
      const groupId = randomId('group');
      const now = new Date().toISOString();

      const payload = {
        id: groupId,
        name: data.name.trim(),
        icon: data.icon || null,
        created_by: data.createdBy,
        created_at: now,
      };

      const { error } = await supabase.from('groups').insert(payload);
      if (error) throwWithFallback(error.message, 'Could not create group');

      const memberIds = unique([data.createdBy, ...(data.memberIds || [])]);
      if (memberIds.length > 0) {
        const rows = memberIds.map((userId) => ({ group_id: groupId, user_id: userId, created_at: now }));
        const { error: memberErr } = await supabase.from('group_members').upsert(rows);
        if (memberErr) throwWithFallback(memberErr.message, 'Could not add group members');
      }

      return rowToGroup(payload as GroupRow, memberIds);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  getUserGroups: async (userId: string) => {
    if (supabase) {
      const { data: memberships, error: membershipErr } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);
      if (membershipErr) throwWithFallback(membershipErr.message, 'Could not load groups');

      const groupIds = unique(((memberships || []) as { group_id: string }[]).map((r) => r.group_id));
      if (!groupIds.length) return [];

      const { data: groups, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });
      if (groupErr) throwWithFallback(groupErr.message, 'Could not load groups');

      const result: (Group & { members: { id: string; displayName: string; username: string; avatarUrl?: string }[] })[] = [];
      for (const group of (groups || []) as GroupRow[]) {
        const members = await getGroupMembersDetailed(group.id);
        const memberIds = members.map((m) => m.id);
        result.push({
          ...rowToGroup(group, memberIds),
          members: members.map((m) => ({ id: m.id, displayName: m.displayName, username: m.username, avatarUrl: m.avatarUrl })),
        });
      }

      return result;
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  getGroup: async (groupId: string) => {
    if (supabase) {
      const { data: group, error: groupErr } = await supabase.from('groups').select('*').eq('id', groupId).single<GroupRow>();
      if (groupErr || !group) throwWithFallback(groupErr?.message || 'Group not found');

      const members = await getGroupMembersDetailed(groupId);
      return {
        ...rowToGroup(group, members.map((m) => m.id)),
        members: members.map((m) => ({
          id: m.id,
          displayName: m.displayName,
          username: m.username,
          avatarUrl: m.avatarUrl,
          phone: m.phone || '',
        })),
      };
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  updateGroup: async (groupId: string, data: { name?: string; icon?: string }) => {
    if (supabase) {
      const payload: Record<string, string | null | undefined> = {
        name: data.name?.trim(),
        icon: data.icon,
      };
      const { error } = await supabase.from('groups').update(payload).eq('id', groupId);
      if (error) throwWithFallback(error.message, 'Could not update group');

      const { data: group, error: getErr } = await supabase.from('groups').select('*').eq('id', groupId).single<GroupRow>();
      if (getErr || !group) throwWithFallback(getErr?.message || 'Group not found');

      const members = await getGroupMembersDetailed(groupId);
      return rowToGroup(group, members.map((m) => m.id));
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  addGroupMembers: async (groupId: string, userIds: string[]) => {
    if (supabase) {
      const rows = unique(userIds).map((userId) => ({ group_id: groupId, user_id: userId, created_at: new Date().toISOString() }));
      if (rows.length > 0) {
        const { error } = await supabase.from('group_members').upsert(rows);
        if (error) throwWithFallback(error.message, 'Could not add members');
      }

      const { data: group, error: groupErr } = await supabase.from('groups').select('*').eq('id', groupId).single<GroupRow>();
      if (groupErr || !group) throwWithFallback(groupErr?.message || 'Group not found');

      const members = await getGroupMembersDetailed(groupId);
      return rowToGroup(group, members.map((m) => m.id));
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  removeGroupMember: async (groupId: string, userId: string) => {
    if (supabase) {
      const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
      if (error) throwWithFallback(error.message, 'Could not remove member');

      const { data: group, error: groupErr } = await supabase.from('groups').select('*').eq('id', groupId).single<GroupRow>();
      if (groupErr || !group) throwWithFallback(groupErr?.message || 'Group not found');

      const members = await getGroupMembersDetailed(groupId);
      return rowToGroup(group, members.map((m) => m.id));
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  deleteGroup: async (groupId: string) => {
    if (supabase) {
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throwWithFallback(error.message, 'Could not delete group');
      return { success: true };
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  // ── Sessions ──────────────────────────────────────────
  health: async () => {
    if (supabase) return { status: 'ok' };
    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  createSession: async (data: {
    adminId: string;
    totalAmount: number;
    currency?: string;
    splitMode?: SplitMode;
    description?: string;
  }) => {
    if (supabase) {
      const joinCode = generateJoinCode();
      const now = new Date().toISOString();
      const sessionId = randomId('session');

      const payload = {
        id: sessionId,
        join_code: joinCode,
        admin_id: data.adminId,
        total_amount: data.totalAmount,
        currency: data.currency || 'COP',
        split_mode: data.splitMode || 'equal',
        description: data.description || null,
        status: 'open' as const,
        created_at: now,
      };

      const { error } = await supabase.from('sessions').insert(payload);
      if (error) throwWithFallback(error.message, 'Could not create session');

      const { data: adminUser } = await supabase.from('users').select('*').eq('id', data.adminId).maybeSingle<UserRow>();
      const adminName = adminUser ? rowToUser(adminUser).displayName : 'Admin';

      const { error: pErr } = await supabase.from('participants').insert({
        join_code: joinCode,
        user_id: data.adminId,
        display_name: adminName,
        amount: 0,
        status: 'pending',
        joined_at: now,
      });
      if (pErr) throwWithFallback(pErr.message, 'Could not add admin as participant');

      return getSessionFromSupabase(joinCode);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  getSession: async (joinCode: string) => {
    if (supabase) return getSessionFromSupabase(joinCode);
    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  joinSession: async (joinCode: string, data: { userId: string; displayName: string }) => {
    if (supabase) {
      const session = await getSessionFromSupabase(joinCode);
      if (session.status !== 'open') throwWithFallback('Session is not open');

      const exists = session.participants.some((p) => p.userId === data.userId);
      if (!exists) {
        const { error } = await supabase.from('participants').insert({
          join_code: joinCode,
          user_id: data.userId,
          display_name: data.displayName,
          amount: 0,
          status: 'pending',
          joined_at: new Date().toISOString(),
        });
        if (error) throwWithFallback(error.message, 'Could not join session');
      }

      return getSessionFromSupabase(joinCode);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  splitSession: async (joinCode: string, data?: { percentages?: number[] }) => {
    if (supabase) {
      const session = await getSessionFromSupabase(joinCode);
      const participants = [...session.participants];
      if (!participants.length) throwWithFallback('No participants in session');

      const updates: { userId: string; amount: number; percentage?: number; isWinner?: boolean }[] = [];

      if (session.splitMode === 'equal') {
        const amounts = splitEqual(session.totalAmount, participants.length);
        participants.forEach((p, idx) => updates.push({ userId: p.userId, amount: amounts[idx] }));
      } else if (session.splitMode === 'percentage') {
        const percentages = data?.percentages || [];
        if (percentages.length !== participants.length) throwWithFallback('Percentages array must match participant count');
        const amounts = splitByPercentage(session.totalAmount, percentages);
        participants.forEach((p, idx) => updates.push({ userId: p.userId, amount: amounts[idx], percentage: percentages[idx] }));
      } else {
        const winnerIdx = Math.floor(Math.random() * participants.length);
        participants.forEach((p, idx) => updates.push({ userId: p.userId, amount: idx === winnerIdx ? session.totalAmount : 0, isWinner: idx === winnerIdx }));
      }

      await Promise.all(
        updates.map((u) =>
          supabase
            .from('participants')
            .update({
              amount: u.amount,
              percentage: u.percentage ?? null,
              is_roulette_winner: !!u.isWinner,
              is_roulette_coward: false,
            })
            .eq('join_code', joinCode)
            .eq('user_id', u.userId)
        )
      );

      if (session.splitMode === 'roulette') {
        const winner = updates.find((u) => u.isWinner);
        if (winner) {
          const winnerParticipant = participants.find((p) => p.userId === winner.userId);
          const message = `🎰 ${winnerParticipant?.displayName || 'Alguien'} perdió la ruleta y paga ${formatCOP(session.totalAmount)}!`;
          const eventId = randomId('feed');
          await supabase.from('feed_events').insert({
            id: eventId,
            session_id: session.id,
            type: 'roulette_win',
            message,
            created_at: new Date().toISOString(),
          });
          await supabase
            .from('feed_event_users')
            .upsert(participants.map((p) => ({ event_id: eventId, user_id: p.userId })));
        }
      }

      return getSessionFromSupabase(joinCode);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  markPaid: async (joinCode: string, data: { userId: string; paymentMethod?: string }) => {
    if (supabase) {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('participants')
        .update({ status: 'confirmed', payment_method: data.paymentMethod || 'other', paid_at: now })
        .eq('join_code', joinCode)
        .eq('user_id', data.userId);
      if (error) throwWithFallback(error.message, 'Could not confirm payment');

      const updated = await getSessionFromSupabase(joinCode);
      await closeSessionIfAllPaid(updated);
      return getSessionFromSupabase(joinCode);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  reportPaid: async (joinCode: string, data: { userId: string; reporterId: string; paymentMethod?: string }) => {
    if (supabase) {
      if (data.userId !== data.reporterId) throwWithFallback('Only participant can report their own payment');

      const { error } = await supabase
        .from('participants')
        .update({ status: 'reported', payment_method: data.paymentMethod || 'other', paid_at: null })
        .eq('join_code', joinCode)
        .eq('user_id', data.userId);
      if (error) throwWithFallback(error.message, 'Could not report payment');

      return getSessionFromSupabase(joinCode);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  approvePaid: async (joinCode: string, data: { userId: string; adminId: string; paymentMethod?: string }) => {
    if (supabase) {
      const session = await getSessionFromSupabase(joinCode);
      if (session.adminId !== data.adminId) throwWithFallback('Only admin can approve payments');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('participants')
        .update({ status: 'confirmed', payment_method: data.paymentMethod || null, paid_at: now })
        .eq('join_code', joinCode)
        .eq('user_id', data.userId);
      if (error) throwWithFallback(error.message, 'Could not approve payment');

      const updated = await getSessionFromSupabase(joinCode);
      await closeSessionIfAllPaid(updated);
      return getSessionFromSupabase(joinCode);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  closeSession: async (joinCode: string) => {
    if (supabase) {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'closed', closed_at: now })
        .eq('join_code', joinCode);
      if (error) throwWithFallback(error.message, 'Could not close session');
      return getSessionFromSupabase(joinCode);
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },

  deleteSession: async (joinCode: string, data: { adminId: string }) => {
    if (supabase) {
      const session = await getSessionFromSupabase(joinCode);
      if (session.adminId !== data.adminId) throwWithFallback('Only admin can delete session');

      const { error } = await supabase.from('sessions').delete().eq('join_code', joinCode);
      if (error) throwWithFallback(error.message, 'Could not delete session');
      return { success: true };
    }

    throwWithFallback(SUPABASE_REQUIRED_ERROR);
  },
};
