'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/coupon.controller');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common.validator');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { couponLimiter } = require('../middleware/rateLimit');

const couponBody = z.object({
  code: z.string().trim().toUpperCase().min(3).max(20),
  description: z.string().trim().max(200).optional(),
  discountType: z.enum(['percent', 'flat']),
  discountValue: z.coerce.number().min(1),
  maxDiscount: z.coerce.number().min(0).optional(),
  minOrderValue: z.coerce.number().min(0).default(0),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  usageLimit: z.coerce.number().int().min(0).default(0),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  firstOrderOnly: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  isPublic: z.coerce.boolean().default(true),
});

router.get('/available', optionalAuth, c.available);
router.post('/validate', couponLimiter, optionalAuth, validate({
  body: z.object({ code: z.string().trim().toUpperCase().max(20), subtotal: z.coerce.number().min(0) }),
}), c.validate);

router.use(protect, authorize('admin'));
router.get('/', c.list);
router.post('/', validate({ body: couponBody }), c.create);
router.put('/:id', validate({ ...idParam, body: couponBody.partial() }), c.update);
router.delete('/:id', validate(idParam), c.remove);

module.exports = router;
