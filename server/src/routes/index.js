'use strict';
const router = require('express').Router();
const env = require('../config/env');
const settingsService = require('../services/settings.service');
const settingsController = require('../controllers/settings.controller');

router.get('/health', (_req, res) =>
  res.json({
    success: true,
    message: 'API is healthy',
    data: {
      service: settingsService.snapshot().general.siteName,
      version: 'v1',
      uptime: Math.round(process.uptime()),
      env: env.nodeEnv,
    },
  }));

/* Kept as an alias of /settings so existing storefront callers keep working. */
router.get('/config', settingsController.publicSettings);

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/categories', require('./category.routes'));
router.use('/products', require('./product.routes'));
router.use('/orders', require('./order.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/coupons', require('./coupon.routes'));
router.use('/delivery', require('./delivery.routes'));
router.use('/snack-box', require('./snackbox.routes'));
router.use('/nutrition', require('./nutrition.routes'));
router.use('/chatbot', require('./chatbot.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
