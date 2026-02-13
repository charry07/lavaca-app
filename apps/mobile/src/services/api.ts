import { PaymentSession, SplitMode, User, FeedEvent, Group } from '@lavaca/shared';
import { Platform } from 'react-native';

// Use EXPO_PUBLIC_API_URL for production, fallback to local dev
const getBaseUrl = () => {
  // Expo env vars prefixed with EXPO_PUBLIC_ are available at build time
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  // Dev fallback
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
};

const BASE_URL = getBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── OTP response type ───────────────────────────────────
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

export const api = {
  // ── OTP / Auth ────────────────────────────────────────
  /** Send OTP to phone number */
  sendOTP: (phone: string) =>
    request<OTPSendResponse>('/api/users/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  /** Verify OTP code */
  verifyOTP: (phone: string, code: string) =>
    request<OTPVerifyResponse>('/api/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  /** Register a new user */
  register: (data: { phone: string; displayName: string; username: string; documentId: string }) =>
    request<User>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Login by phone number */
  login: (phone: string) =>
    request<User>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  /** Get user by ID */
  getUser: (userId: string) =>
    request<User>(`/api/users/${userId}`),

  /** Update user profile */
  updateUser: (userId: string, data: { displayName?: string; username?: string; documentId?: string; avatarUrl?: string }) =>
    request<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Look up users by phone numbers (contacts) */
  lookupByPhones: (phones: string[]) =>
    request<User[]>('/api/users/lookup', {
      method: 'POST',
      body: JSON.stringify({ phones }),
    }),

  /** Get user transaction history */
  getUserHistory: (userId: string) =>
    request<PaymentSession[]>(`/api/users/${userId}/history`),

  // ── Feed ──────────────────────────────────────────────
  /** Get global feed */
  getFeed: () =>
    request<FeedEvent[]>('/api/feed'),

  /** Get feed for a specific user */
  getUserFeed: (userId: string) =>
    request<FeedEvent[]>(`/api/feed/user/${userId}`),

  // ── Groups ────────────────────────────────────────────
  /** Create a new group */
  createGroup: (data: { name: string; icon?: string; memberIds?: string[]; createdBy: string }) =>
    request<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get all groups for a user */
  getUserGroups: (userId: string) =>
    request<(Group & { members: { id: string; displayName: string; username: string; avatarUrl?: string }[] })[]>(`/api/groups/user/${userId}`),

  /** Get a specific group */
  getGroup: (groupId: string) =>
    request<Group & { members: { id: string; displayName: string; username: string; avatarUrl?: string; phone: string }[] }>(`/api/groups/${groupId}`),

  /** Update group */
  updateGroup: (groupId: string, data: { name?: string; icon?: string }) =>
    request<Group>(`/api/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** Add members to group */
  addGroupMembers: (groupId: string, userIds: string[]) =>
    request<Group>(`/api/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    }),

  /** Remove member from group */
  removeGroupMember: (groupId: string, userId: string) =>
    request<Group>(`/api/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),

  /** Delete group */
  deleteGroup: (groupId: string) =>
    request<{ success: boolean }>(`/api/groups/${groupId}`, {
      method: 'DELETE',
    }),

  // ── Sessions ──────────────────────────────────────────
  /** Health check */
  health: () => request<{ status: string }>('/health'),

  /** Create a new payment session */
  createSession: (data: {
    adminId: string;
    totalAmount: number;
    currency?: string;
    splitMode?: SplitMode;
    description?: string;
  }) => request<PaymentSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Get session by join code */
  getSession: (joinCode: string) =>
    request<PaymentSession>(`/api/sessions/${joinCode}`),

  /** Join an existing session */
  joinSession: (joinCode: string, data: { userId: string; displayName: string }) =>
    request<PaymentSession>(`/api/sessions/${joinCode}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Calculate the split for a session */
  splitSession: (joinCode: string, data?: { percentages?: number[] }) =>
    request<PaymentSession>(`/api/sessions/${joinCode}/split`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  /** Mark a participant as paid */
  markPaid: (joinCode: string, data: { userId: string; paymentMethod?: string }) =>
    request<PaymentSession>(`/api/sessions/${joinCode}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
