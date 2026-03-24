import { createSupabaseClient } from '@lavaca/supabase';
import type {
  AISplitRequest,
  AISplitResponse,
  AIReminderRequest,
  AIReminderResponse,
} from '@lavaca/shared';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const AI_ENABLED = process.env.EXPO_PUBLIC_AI_ENABLED === 'true';

export const aiService = {
  /**
   * Recommend equal / percentage / roulette based on bill context.
   * Returns null if AI is disabled or the call fails (graceful fallback).
   */
  suggestSplit: async (req: AISplitRequest): Promise<AISplitResponse | null> => {
    if (!AI_ENABLED || !supabase) return null;
    try {
      const { data, error } = await supabase.functions.invoke('ai-copilot', { body: req });
      if (error || !data || data.fallback) return null;
      return data as AISplitResponse;
    } catch {
      return null;
    }
  },

  /**
   * Generate a friendly reminder message for pending participants.
   * Returns null if AI is disabled or the call fails.
   */
  generateReminder: async (req: AIReminderRequest): Promise<AIReminderResponse | null> => {
    if (!AI_ENABLED || !supabase) return null;
    try {
      const { data, error } = await supabase.functions.invoke('ai-copilot', { body: req });
      if (error || !data || data.fallback) return null;
      return data as AIReminderResponse;
    } catch {
      return null;
    }
  },
};
