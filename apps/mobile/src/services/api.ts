import { PaymentSession, SplitMode, User, FeedEvent } from '@lavaca/shared';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine
const getBaseUrl = () => {
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

export const api = {
  // ── Auth ──────────────────────────────────────────────
  /** Register a new user (or auto-login if phone exists) */
  register: (data: { phone: string; displayName: string; username: string; documentId?: string }) =>
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

  // ── Feed ──────────────────────────────────────────────
  /** Get global feed */
  getFeed: () =>
    request<FeedEvent[]>('/api/feed'),

  /** Get feed for a specific user */
  getUserFeed: (userId: string) =>
    request<FeedEvent[]>(`/api/feed/user/${userId}`),

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
