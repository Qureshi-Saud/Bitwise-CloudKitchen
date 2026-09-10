import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/client';
import { SOCKET_URL } from '../lib/config';

let socket = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return socket;
}

/** Subscribes to a socket event for the lifetime of the component. */
export function useSocketEvent(event, handler, deps = []) {
  const saved = useRef(handler);
  useEffect(() => { saved.current = handler; }, [handler]);

  useEffect(() => {
    const s = getSocket();
    const listener = (payload) => saved.current?.(payload);
    s.on(event, listener);
    return () => s.off(event, listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

/** Joins an order room so admin status changes arrive live. */
export function useOrderTracking(orderNumber, onStatus) {
  useSocketEvent('order:status', onStatus, [orderNumber]);

  useEffect(() => {
    if (!orderNumber) return undefined;
    const s = getSocket();
    s.emit('order:subscribe', orderNumber);
    return () => s.emit('order:unsubscribe', orderNumber);
  }, [orderNumber]);
}
