'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/review.controller');
const validate = require('../middleware/validate');
const { objectId, idParam } = require('../validators/common.validator');
const { protect, authorize } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');

const createBody = z.object({
  productId: objectId,
  orderId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(90).optional(),
  comment: z.string().trim().max(800).optional(),
});

router.get('/product/:productId', validate({ params: z.object({ productId: objectId }) }), c.listForProduct);

router.use(protect);
router.get('/pending', c.pending);
router.get('/my', c.myReviews);
router.post('/', writeLimiter, validate({ body: createBody }), c.create);
router.put('/:id', validate({ ...idParam, body: createBody.partial() }), c.update);
router.delete('/:id', validate(idParam), c.remove);

router.get('/', authorize('admin', 'staff'), c.adminList);
router.patch('/:id/moderate', authorize('admin'), validate({
  ...idParam,
  // The moderation body reached the document unchecked, so an arbitrary status
  // string and an unbounded admin reply could be written straight through.
  body: z.object({
    status: z.enum(['published', 'pending', 'hidden']).optional(),
    reply: z.string().trim().min(1).max(600).optional(),
  }),
}), c.moderate);

module.exports = router;
