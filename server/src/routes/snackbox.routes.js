'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/snackbox.controller');
const validate = require('../middleware/validate');
const { objectId } = require('../validators/common.validator');
const { protect, authorize } = require('../middleware/auth');

const quoteBody = z.object({
  boxItems: z.array(z.object({
    productId: objectId,
    quantity: z.coerce.number().int().min(1).max(10),
  })).min(1, 'Add at least one snack to your box').max(12),
  extras: z.array(z.string().trim().max(30)).max(10).default([]),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

const nutritionDelta = z.object({
  calories: z.coerce.number().default(0),
  protein: z.coerce.number().default(0),
  carbs: z.coerce.number().default(0),
  fat: z.coerce.number().default(0),
  fibre: z.coerce.number().default(0),
}).partial();

/**
 * The admin body used to go into findOneAndUpdate() unvalidated, which let any
 * top-level field be written - including `key`, the singleton discriminator the
 * storefront reads from. Everything writable is now whitelisted and bounded.
 */
const configBody = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(300),
  minItems: z.coerce.number().int().min(1).max(50),
  maxItems: z.coerce.number().int().min(1).max(50),
  packagingFee: z.coerce.number().min(0).max(10000),
  sizeTiers: z.array(z.object({
    items: z.coerce.number().int().min(1).max(50),
    label: z.string().trim().min(1).max(60),
    discountPercent: z.coerce.number().min(0).max(100),
  })).max(10),
  extras: z.array(z.object({
    key: z.string().trim().toLowerCase().min(1).max(40),
    label: z.string().trim().min(1).max(60),
    price: z.coerce.number().min(0).max(5000),
    nutritionDelta: nutritionDelta.optional(),
    isAvailable: z.coerce.boolean().default(true),
  })).max(30),
  isActive: z.coerce.boolean(),
}).partial().refine(
  (v) => v.minItems === undefined || v.maxItems === undefined || v.minItems <= v.maxItems,
  { message: 'minItems cannot be greater than maxItems' }
);

router.get('/config', c.config);
router.post('/quote', validate({ body: quoteBody }), c.quote);

router.use(protect, authorize('admin'));
router.get('/admin/config', c.adminConfig);
router.put('/admin/config', validate({ body: configBody }), c.updateConfig);

module.exports = router;
