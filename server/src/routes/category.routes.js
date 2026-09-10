'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/category.controller');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common.validator');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const body = z.object({
  name: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(400).optional(),
  image: z.object({ url: z.string().url(), publicId: z.string().optional() }).optional(),
  icon: z.string().trim().max(40).optional(),
  accent: z.string().trim().max(20).optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
});

router.get('/', optionalAuth, c.list);
router.get('/:slug', c.getBySlug);

router.post('/', protect, authorize('admin'), validate({ body }), c.create);
router.put('/:id', protect, authorize('admin'), validate({ ...idParam, body: body.partial() }), c.update);
router.delete('/:id', protect, authorize('admin'), validate(idParam), c.remove);

module.exports = router;
