import { useCallback, useEffect } from 'react';
import { PaymentSession } from '@lavaca/shared';
import { useSocket } from './useSocket';

/**
 * Joins the Socket.IO room for `joinCode` and fires `onUpdate` whenever
 * the server emits a `session-update` event. Leaves the room on unmount.
 */
export function useSessionSocket(
  joinCode: string | undefined,
  onUpdate: (session: PaymentSession) => void,
): void {
  const socket = useSocket();

  // Stable reference so the effect deps don't fire on every render
  const stableOnUpdate = useCallback(onUpdate, [onUpdate]);

  useEffect(() => {
    if (!joinCode) return;

    socket.emit('join-session', joinCode);
    socket.on('session-update', stableOnUpdate);

    return () => {
      socket.off('session-update', stableOnUpdate);
      socket.emit('leave-session', joinCode);
    };
  }, [socket, joinCode, stableOnUpdate]);
}
