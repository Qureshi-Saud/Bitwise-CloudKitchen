'use strict';
const mongoose = require('mongoose');

/**
 * One document per signed-in device/session. Enables multi-device login,
 * "logout from this device" and "logout from all devices" with token rotation.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, index: true },
    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 60 },
    device: { type: String, maxlength: 120 },
    revokedAt: Date,
    replacedBy: String,
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// TTL cleanup of expired sessions.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.virtual('isActive').get(function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
