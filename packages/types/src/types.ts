// La Vaca - Domain Types

export type SplitMode = 'equal' | 'percentage' | 'roulette';
export type PaymentStatus = 'pending' | 'reported' | 'confirmed' | 'failed' | 'rejected';
export type SessionStatus = 'open' | 'closed' | 'cancelled';
export type PaymentMethod = 'nequi' | 'daviplata' | 'pse' | 'transfiya' | 'cash' | 'other';
export type AccountType = 'nequi' | 'daviplata' | 'pse' | 'transfiya' | 'bank_account' | 'cash' | 'other';
export type BankAccountType = 'ahorros' | 'corriente';
export type NotificationType = 'debt_reminder' | 'payment_received' | 'payment_approved' | 'payment_rejected' | 'session_closed';

export interface Country {
  flag: string;
  name: string;
  dial: string;
  code: string; // ISO 3166-1 alpha-2 code
}

export interface User {
  id: string;
  phone: string;
  displayName: string;
  username: string;
  documentId?: string;
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

export interface PaymentAccount {
  id: string;
  userId: string;
  methodType: AccountType;
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: BankAccountType;
  llave?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
  isPreferred: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtSummary {
  sessionId: string;
  joinCode: string;
  debtorId: string;
  debtorDisplayName: string;
  creditorId: string;
  creditorDisplayName: string;
  amount: number;
  currency: string;
  debtorStatus: PaymentStatus;
  creditorAccounts: PaymentAccount[];
}
