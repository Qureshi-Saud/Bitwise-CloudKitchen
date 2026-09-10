'use strict';
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role, email: user.email }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
    issuer: 'bitewise-api',
  });

const signRefreshToken = (user, sessionId) =>
  jwt.sign({ sub: String(user._id), sid: sessionId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    issuer: 'bitewise-api',
  });

const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret, { issuer: 'bitewise-api' });
const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret, { issuer: 'bitewise-api' });

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

/** Convert "30d" / "15m" / "3600" into milliseconds. */
function msFromExpiry(expiry) {
  const m = /^(\d+)([smhd])?$/.exec(String(expiry).trim());
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = m[2] || 's';
  return n * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
}

module.exports = {
  signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken,
  sha256, msFromExpiry,
};
