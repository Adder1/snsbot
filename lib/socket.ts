import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

export const initSocket = async (userId: string) => {
  if (!socket) {
    try {
      // Socket.IO 서버 초기화
      await fetch('/api/socket');
      
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        query: { userId },
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        reconnectAttempts = 0;
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reconnectAttempts++;
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.log('Max reconnection attempts reached');
          socket?.disconnect();
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
}; 