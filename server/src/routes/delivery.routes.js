'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/delivery.controller');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common.validator');
const { protect, authorize } = require('../middleware/auth');

const slotBody = z.object({
  label: z.string().trim().min(2).max(60),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm format'),
  capacity: z.coerce.number().int().min(1).max(500).default(40),
  cutoffMinutes: z.coerce.number().int().min(0).max(720).default(60),
  order: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

router.get('/slots', c.slots);
router.get('/info', c.info);

router.use(protect, authorize('admin', 'staff'));
router.get('/admin/slots', c.list);
router.post('/slots', validate({ body: slotBody }), c.create);
router.put('/slots/:id', validate({ ...idParam, body: slotBody.partial() }), c.update);
router.delete('/slots/:id', validate(idParam), c.remove);

module.exports = router;
