'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/contact.controller');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common.validator');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const contactBody = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number').optional().or(z.literal('')),
  subject: z.enum(['general', 'order', 'bulk', 'feedback', 'partnership', 'support']).default('general'),
  message: z.string().trim().min(10, 'Please tell us a little more').max(1200),
});

router.get('/info', c.info);
router.post('/', authLimiter, validate({ body: contactBody }), c.submit);

router.use(protect, authorize('admin', 'staff'));
router.get('/', c.list);
router.patch('/:id', validate({
  ...idParam,
  body: z.object({
    status: z.enum(['new', 'in-progress', 'resolved']).optional(),
    adminNote: z.string().trim().max(600).optional(),
  }),
}), c.update);

module.exports = router;
