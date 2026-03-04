import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getBaseUrl } from '../utils/baseUrl';

// Singleton — one connection per app lifetime
let _socket: Socket | null = null;

function getSocket(): Socket {
  if (!_socket) {
    _socket = io(getBaseUrl(), {
      // React Native requires websocket transport — polling does not work reliably
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return _socket;
}

export function useSocket(): Socket {
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }
    return () => {
      // Do NOT disconnect on unmount — singleton stays alive for the app's lifetime
    };
  }, []);

  return socketRef.current;
}
