import { useCallback, useEffect } from 'react';
import { PaymentSession } from '@lavaca/types';
import { useSocket } from './useSocket';
import { api } from '../services/api';

/**
 * Subscribes to Supabase realtime updates for one session join code.
 */
export function useSessionSocket(
  joinCode: string | undefined,
  onUpdate: (session: PaymentSession) => void,
): void {
  const transport = useSocket();

  // Stable reference so the effect deps don't fire on every render
  const stableOnUpdate = useCallback(onUpdate, [onUpdate]);

  useEffect(() => {
    if (!joinCode) return;

    const channel = transport.supabase
      .channel(`session:${joinCode}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `join_code=eq.${joinCode}`,
      }, async () => {
        try {
          const updated = await api.getSession(joinCode);
          stableOnUpdate(updated);
        } catch {
          // ignore transient realtime fetch errors
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `join_code=eq.${joinCode}`,
      }, async () => {
        try {
          const updated = await api.getSession(joinCode);
          stableOnUpdate(updated);
        } catch {
          // ignore transient realtime fetch errors
        }
      })
      .subscribe();

    return () => {
      transport.supabase.removeChannel(channel);
    };
  }, [transport, joinCode, stableOnUpdate]);
}
