'use strict';
const Notification = require('../models/Notification');
const { emitTo } = require('../sockets');
const logger = require('../config/logger');

/** Persists a notification and pushes it live to the user's socket room. */
async function notify(userId, { title, body, type = 'system', link, meta }) {
  try {
    const doc = await Notification.create({ user: userId, title, body, type, link, meta });
    emitTo(`user:${userId}`, 'notification:new', doc.toJSON());
    return doc;
  } catch (err) {
    logger.error('Failed to create notification: ' + err.message);
    return null;
  }
}

async function notifyAdmins(event, payload) {
  emitTo('admins', event, payload);
}

module.exports = { notify, notifyAdmins };
