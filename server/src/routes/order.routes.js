'use strict';
const router = require('express').Router();
const c = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const v = require('../validators/order.validator');
const { idParam } = require('../validators/common.validator');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { trackLimiter, writeLimiter } = require('../middleware/rateLimit');

// Cart quote works for guests so the cart page can show live totals before login.
router.post('/quote', optionalAuth, validate(v.quote), c.quote);
// Tracking is unauthenticated by design, so it carries its own tight limiter to
// make bulk lookups against the order-number space impractical.
router.get('/track/:orderNumber', trackLimiter, optionalAuth, validate(v.track), c.track);

router.use(protect);

router.post('/', writeLimiter, validate(v.create), c.create);
router.get('/my', c.myOrders);
router.patch('/:id/cancel', validate(v.cancel), c.cancel);

// Admin
router.get('/', authorize('admin', 'staff'), validate(v.list), c.adminList);
router.get('/stats', authorize('admin', 'staff'), c.stats);
router.patch('/:id/status', authorize('admin', 'staff'), validate(v.updateStatus), c.updateStatus);

router.get('/:id', validate(idParam), c.getOne);

module.exports = router;
