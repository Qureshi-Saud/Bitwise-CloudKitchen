'use strict';
const env = require('../config/env');
const { msFromExpiry } = require('./token');

const REFRESH_COOKIE = 'bitewise_refresh_token';

const baseOptions = () => ({
  httpOnly: true,
  secure: env.cookie.secure || env.isProd,
  sameSite: env.cookie.secure || env.isProd ? 'none' : 'lax',
  domain: env.cookie.domain || undefined,
  path: '/',
});

const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(), maxAge: msFromExpiry(env.jwt.refreshExpiresIn) });

const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, baseOptions());

module.exports = { REFRESH_COOKIE, setRefreshCookie, clearRefreshCookie };
