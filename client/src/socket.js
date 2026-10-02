import { io } from 'socket.io-client';

// En production, si la variable n'est pas définie, on laisse vide :
// Socket.io se connectera automatiquement sur l'hôte et le port courants (window.location).
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.PROD ? undefined : 'http://localhost:3001');

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});