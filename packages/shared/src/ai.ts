// AI request/response contracts — consumed by mobile and Supabase Edge Functions

export type AISplitMode = 'equal' | 'percentage' | 'roulette';

export interface AISplitRequest {
  action: 'split';
  totalAmount: number;
  participantCount: number;
  description?: string;
  currency: string;
}

export interface AISplitResponse {
  mode: AISplitMode;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AIReminderRequest {
  action: 'reminder';
  sessionDescription?: string;
  pendingNames: string[];
  totalAmount: number;
  currency: string;
}

export interface AIReminderResponse {
  message: string;
}

export interface AIErrorEnvelope {
  error: string;
  fallback: true;
}
