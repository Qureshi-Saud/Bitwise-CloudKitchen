'use strict';
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/ApiResponse');
const settingsService = require('../services/settings.service');
const env = require('../config/env');

/** GET /settings - public business profile the storefront renders from. */
exports.publicSettings = asyncHandler(async (_req, res) => {
  const settings = await settingsService.get();
  return ok(res, {
    message: 'Storefront settings',
    data: {
      ...settingsService.publicShape(settings),
      // Client-side integration keys live on the server so the frontends need
      // no build-time secrets of their own.
      googleClientId: env.google.clientId || '',
      isSubscriptionBusiness: false,
      orderingModel: 'on-demand',
    },
  });
});

/* ------------------------------ Admin actions ----------------------------- */

/** GET /settings/admin - full document, including per-field update stamps. */
exports.adminSettings = asyncHandler(async (_req, res) => {
  const settings = await settingsService.get();
  return ok(res, { message: 'Business settings', data: settingsService.adminShape(settings) });
});

/** PUT /settings/admin - save one or more sections. */
exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.update(req.body);
  return ok(res, {
    message: 'Settings saved. The storefront is already using them.',
    data: settingsService.adminShape(settings),
  });
});
