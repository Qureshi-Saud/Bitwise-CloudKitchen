'use strict';
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const RefreshToken = require('../models/RefreshToken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { signAccessToken, signRefreshToken, verifyRefreshToken, sha256, msFromExpiry } = require('../utils/token');

const googleClient = env.google.clientId ? new OAuth2Client(env.google.clientId) : null;

const shortDevice = (userAgent = '') => {
  const ua = String(userAgent);
  const os = /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS'
    : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Unknown OS';
  const browser = /Edg\//i.test(ua) ? 'Edge' : /Chrome\//i.test(ua) ? 'Chrome' : /Safari\//i.test(ua) ? 'Safari'
    : /Firefox\//i.test(ua) ? 'Firefox' : 'Browser';
  return browser + ' on ' + os;
};

/** Issues a new access + refresh pair and persists the session document. */
async function issueTokens(user, req) {
  const sessionId = crypto.randomUUID();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, sessionId);

  await RefreshToken.create({
    user: user._id,
    sessionId,
    tokenHash: sha256(refreshToken),
    userAgent: req?.headers?.['user-agent']?.slice(0, 300),
    ip: req?.ip,
    device: shortDevice(req?.headers?.['user-agent']),
    expiresAt: new Date(Date.now() + msFromExpiry(env.jwt.refreshExpiresIn)),
  });

  return { accessToken, refreshToken, sessionId };
}

/**
 * Rotates a refresh token. If a already-revoked token is replayed we treat it
 * as theft and revoke every session for that user.
 */
async function rotateRefreshToken(rawToken, req) {
  if (!rawToken) throw ApiError.unauthorized('No refresh token provided', { code: 'NO_REFRESH_TOKEN' });

  const payload = verifyRefreshToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash: sha256(rawToken) }).populate('user');

  if (!stored) throw ApiError.unauthorized('Invalid session, please sign in again', { code: 'SESSION_INVALID' });

  if (stored.revokedAt) {
    await RefreshToken.updateMany({ user: stored.user, revokedAt: null }, { revokedAt: new Date() });
    throw ApiError.unauthorized('Session reuse detected. All devices have been signed out.', { code: 'SESSION_REUSE' });
  }
  if (stored.expiresAt < new Date()) throw ApiError.unauthorized('Session expired, please sign in again');

  const user = stored.user;
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.isBlocked) throw ApiError.forbidden('Your account has been suspended.');

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user, payload.sid);

  stored.revokedAt = new Date();
  stored.replacedBy = sha256(newRefreshToken);
  await stored.save();

  await RefreshToken.create({
    user: user._id,
    sessionId: payload.sid,
    tokenHash: sha256(newRefreshToken),
    userAgent: req?.headers?.['user-agent']?.slice(0, 300),
    ip: req?.ip,
    device: shortDevice(req?.headers?.['user-agent']),
    expiresAt: new Date(Date.now() + msFromExpiry(env.jwt.refreshExpiresIn)),
  });

  return { accessToken, refreshToken: newRefreshToken, user };
}

const revokeSession = (rawToken) =>
  RefreshToken.findOneAndUpdate({ tokenHash: sha256(rawToken), revokedAt: null }, { revokedAt: new Date() });

const revokeAllSessions = (userId) =>
  RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });

const listSessions = (userId) =>
  RefreshToken.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .select('sessionId device ip lastUsedAt createdAt')
    .sort({ createdAt: -1 })
    .lean();

/** Verifies a Google ID token issued to our client id. */
async function verifyGoogleIdToken(idToken) {
  if (!googleClient) throw ApiError.badRequest('Google sign-in is not configured on this server');
  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.google.clientId });
  const p = ticket.getPayload();
  if (!p?.email) throw ApiError.unauthorized('Google account did not return an email address');
  return { googleId: p.sub, email: p.email.toLowerCase(), name: p.name || p.email.split('@')[0], picture: p.picture, emailVerified: Boolean(p.email_verified) };
}

module.exports = {
  issueTokens, rotateRefreshToken, revokeSession, revokeAllSessions, listSessions, verifyGoogleIdToken,
};
