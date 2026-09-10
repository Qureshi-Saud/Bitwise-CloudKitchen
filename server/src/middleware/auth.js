'use strict';
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Requires a valid access token. Attaches req.user. */
const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Please sign in to continue');

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).select('+passwordChangedAt');
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.isBlocked) throw ApiError.forbidden('Your account has been suspended. Please contact support.');
  if (user.passwordChangedAfter(payload.iat)) {
    throw ApiError.unauthorized('Password recently changed, please sign in again', { code: 'TOKEN_STALE' });
  }

  req.user = user;
  req.accessPayload = payload;
  next();
});

/** Attaches req.user when a token is present, but never fails for guests. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('+passwordChangedAt');
    // Same staleness check as protect(): a token minted before a password reset
    // must not keep working here just because the route tolerates guests.
    if (user && !user.isBlocked && !user.passwordChangedAfter(payload.iat)) req.user = user;
  } catch (e) {
    // Invalid/expired token on a public route: continue as guest.
  }
  next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};

module.exports = { protect, optionalAuth, authorize };
