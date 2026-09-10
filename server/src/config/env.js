'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const bool = (v, d = false) => (v === undefined ? d : String(v).toLowerCase() === 'true');
const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const adminUrl = (process.env.ADMIN_URL || 'http://localhost:5174').replace(/\/$/, '');

// Any extra browser origins (comma separated) that should also reach this API.
const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const isProd = (process.env.NODE_ENV || 'development') === 'production';

// The dev servers run with strictPort, so 5173/5174 are the only browser ports
// that ever exist. 127.0.0.1 is listed alongside localhost because the browser
// treats them as separate origins even though they are the same host.
const localAliases = (url) => {
  const match = /^http:\/\/localhost(:\d+)?$/.exec(url);
  return match ? [url, 'http://127.0.0.1' + (match[1] || '')] : [url];
};

const allowedOrigins = [
  ...new Set([...localAliases(clientUrl), ...localAliases(adminUrl), ...extraOrigins]),
];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: num(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientUrl,
  adminUrl,

  // The storefront and the admin panel are the only browser origins that talk
  // to this API, so the CORS allowlist is derived from them instead of being a
  // second list to keep in sync. Everything else here is a constant.
  cors: {
    origin: allowedOrigins,
    isAllowed(origin) {
      return allowedOrigins.includes(String(origin).replace(/\/$/, ''));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // x-refresh-token is the header fallback for clients without cookies.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-refresh-token'],
    maxAge: 86400,
  },

  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloud_kitchen',

  jwt: {
    // No production fallback: a predictable signing key lets anyone forge an
    // admin access token. requireProdSecrets() below refuses to boot without one.
    accessSecret: process.env.JWT_ACCESS_SECRET || (isProd ? '' : 'dev_only_access_secret'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (isProd ? '' : 'dev_only_refresh_secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: bool(process.env.COOKIE_SECURE, false),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'store',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    // Only a last resort: the mailer prefers the store name saved in the
    // admin panel and falls back to this when settings have not loaded yet.
    fromName: process.env.MAIL_FROM_NAME || '',
    fromEmail: process.env.MAIL_FROM_EMAIL || 'no-reply@example.com',
  },

  rateLimit: {
    windowMinutes: num(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
    max: num(process.env.RATE_LIMIT_MAX, 600),
    authMax: num(process.env.AUTH_RATE_LIMIT_MAX, 30),
    // Order tracking is the only unauthenticated endpoint that reads a stored
    // order, so it gets its own much tighter budget.
    trackMax: num(process.env.TRACK_RATE_LIMIT_MAX, 20),
    // Coupon codes are short and guessable; validation is throttled separately.
    couponMax: num(process.env.COUPON_RATE_LIMIT_MAX, 30),
  },
};

/**
 * Refuses to start a production process with missing or obviously unsafe
 * secrets. A booted-but-misconfigured API is worse than a failed deploy: with a
 * fallback JWT secret anyone who has read the source can mint an admin token.
 */
function requireProdSecrets() {
  if (!isProd) return;

  const required = {
    JWT_ACCESS_SECRET: env.jwt.accessSecret,
    JWT_REFRESH_SECRET: env.jwt.refreshSecret,
    MONGODB_URI: process.env.MONGODB_URI,
  };

  const problems = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key + ' is not set');

  Object.entries(required).forEach(([key, value]) => {
    if (key.startsWith('JWT_') && value && String(value).length < 32) {
      problems.push(key + ' must be at least 32 characters');
    }
  });

  if (env.jwt.accessSecret && env.jwt.accessSecret === env.jwt.refreshSecret) {
    problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values');
  }
  if (env.razorpay.webhookSecret && env.razorpay.webhookSecret === env.jwt.accessSecret) {
    problems.push('RAZORPAY_WEBHOOK_SECRET must not reuse JWT_ACCESS_SECRET');
  }
  if (!env.cookie.secure) {
    problems.push('COOKIE_SECURE must be true so the refresh cookie is never sent over plain HTTP');
  }

  if (problems.length) {
    throw new Error('Refusing to start in production:\n  - ' + problems.join('\n  - '));
  }
}

env.requireProdSecrets = requireProdSecrets;

module.exports = env;
