import { io } from 'socket.io-client';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, '')
  || 'http://localhost:3001';

export const socket = io(socketUrl, {
  autoConnect: false,
});

