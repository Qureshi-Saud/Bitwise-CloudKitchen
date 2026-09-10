'use strict';
const { Server } = require('socket.io');
const env = require('../config/env');
const logger = require('../config/logger');
const { verifyAccessToken } = require('../utils/token');
const Order = require('../models/Order');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || env.cors.isAllowed(origin)) return callback(null, true);
        return callback(new Error('This origin is not allowed by CORS policy'));
      },
      credentials: env.cors.credentials,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  // Optional auth: guests may still track an order by joining an order room.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
    } catch (e) {
      // Ignore bad token, continue as guest socket.
    }
    next();
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data;
    if (userId) socket.join(`user:${userId}`);
    if (role === 'admin' || role === 'staff') socket.join('admins');

    /**
     * Joining an order room must be authorised, not just requested. Previously
     * any anonymous socket could join `order:<number>` and receive the live
     * status feed for somebody else's order; now the socket has to be signed in
     * as the owner, or be kitchen staff.
     */
    socket.on('order:subscribe', async (orderNumber) => {
      if (typeof orderNumber !== 'string' || orderNumber.length < 6 || orderNumber.length > 40) return;
      if (role !== 'admin' && role !== 'staff') {
        if (!userId) return;
        const owns = await Order.exists({ orderNumber: orderNumber.toUpperCase(), user: userId }).catch(() => null);
        if (!owns) return;
      }
      socket.join(`order:${orderNumber}`);
    });
    socket.on('order:unsubscribe', (orderNumber) => {
      if (typeof orderNumber === 'string') socket.leave(`order:${orderNumber}`);
    });

    socket.on('disconnect', () => {});
  });

  logger.info('Socket.IO gateway ready');
  return io;
}

/** Safe emit - never throws if sockets are not initialised (e.g. in scripts/tests). */
function emitTo(room, event, payload) {
  if (!io) return;
  io.to(room).emit(event, payload);
}

module.exports = { initSocket, emitTo };
