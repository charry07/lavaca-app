// La Vaca - Domain Types

export type SplitMode = 'equal' | 'percentage' | 'roulette';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'rejected';
export type SessionStatus = 'open' | 'closed' | 'cancelled';
export type PaymentMethod = 'nequi' | 'daviplata' | 'pse' | 'transfiya' | 'cash' | 'other';

export interface User {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  createdAt: Date;
}

export interface Participant {
  userId: string;
  displayName: string;
  amount: number;
  percentage?: number;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  isRouletteWinner?: boolean;
  isRouletteCoward?: boolean;
  joinedAt: Date;
  paidAt?: Date;
}

export interface PaymentSession {
  id: string;
  joinCode: string;
  qrCode?: string;
  adminId: string;
  totalAmount: number;
  currency: string;
  splitMode: SplitMode;
  participants: Participant[];
  status: SessionStatus;
  description?: string;
  receiptImageUrl?: string;
  ocrAmount?: number;
  createdAt: Date;
  closedAt?: Date;
}

export interface Group {
  id: string;
  name: string;
  icon?: string;
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
}

export interface Debt {
  id: string;
  sessionId: string;
  debtorId: string;
  creditorId: string;
  amount: number;
  currency: string;
  description?: string;
  isPaid: boolean;
  createdAt: Date;
  paidAt?: Date;
}

export interface FeedEvent {
  id: string;
  groupId?: string;
  sessionId?: string;
  type: 'roulette_win' | 'roulette_coward' | 'fast_payer' | 'session_closed' | 'debt_reminder';
  message: string;
  userIds: string[];
  createdAt: Date;
}
