'use strict';
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const message = {
  success: false,
  message: 'Too many requests. Please slow down and try again shortly.',
  code: 'RATE_LIMITED',
};

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  message,
};

const apiLimiter = rateLimit({
  ...base,
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.max,
  // Razorpay retries webhooks from a small pool of IPs. Counting those against
  // the shared per-IP budget would let a burst of retries drop real payment
  // confirmations, so the signed webhook is excluded from the global limiter.
  skip: (req) => req.path === '/payments/webhook',
});

const authLimiter = rateLimit({
  ...base,
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.authMax,
  skipSuccessfulRequests: true,
  message: { ...message, message: 'Too many authentication attempts. Try again in a few minutes.' },
});

/**
 * Per-account login throttle. The IP limiter alone does not stop credential
 * stuffing spread across a botnet, because every request then comes from a
 * different address; this one keys on the account being attacked instead.
 */
const loginAccountLimiter = rateLimit({
  ...base,
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => 'login:' + String(req.body?.email || '').toLowerCase().trim(),
  // A missing email is a validation error, not a login attempt worth counting.
  skip: (req) => !req.body?.email,
  message: {
    ...message,
    message: 'Too many failed sign-in attempts for this account. Please wait a few minutes or reset your password.',
  },
});

/** Guest order tracking - the tightest budget, because it reads a stored order. */
const trackLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: env.rateLimit.trackMax,
  message: { ...message, message: 'Too many tracking lookups. Please wait a minute and try again.' },
});

/** Coupon codes are short and guessable, so validation attempts are throttled. */
const couponLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: env.rateLimit.couponMax,
  skipSuccessfulRequests: true,
  message: { ...message, message: 'Too many coupon attempts. Please wait a minute and try again.' },
});

/** Order placement and review submission - enough for real use, not for scripts. */
const writeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 20,
  message: { ...message, message: 'You are doing that too quickly. Please wait a moment.' },
});

module.exports = {
  apiLimiter,
  authLimiter,
  loginAccountLimiter,
  trackLimiter,
  couponLimiter,
  writeLimiter,
};
