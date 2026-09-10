import { io } from 'socket.io-client';
import { getAccessToken } from '../api/client';
import { SOCKET_URL as URL } from './config';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(URL, {
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return socket;
}

export function reconnectWithAuth() {
  if (socket) {
    socket.disconnect();
    socket.connect();
  }
}
