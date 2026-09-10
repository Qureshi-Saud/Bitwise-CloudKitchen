'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/payment.controller');
const validate = require('../middleware/validate');
const { objectId } = require('../validators/common.validator');
const { protect, authorize } = require('../middleware/auth');

const verifyBody = z.object({
  razorpayOrderId: z.string().min(4),
  razorpayPaymentId: z.string().min(4),
  signature: z.string().min(10),
});

router.get('/methods', c.methods);
router.get('/config', c.config);
router.post('/webhook', c.webhook);

router.use(protect);
router.post('/:orderId/create', validate({ params: z.object({ orderId: objectId }) }), c.createCheckout);
router.post('/verify', validate({ body: verifyBody }), c.verify);
router.post('/:orderId/refund', authorize('admin'), c.refund);

module.exports = router;
