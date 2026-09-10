'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/adminUser.controller');
const upload = require('../controllers/upload.controller');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common.validator');
const { protect, authorize } = require('../middleware/auth');
const uploader = require('../middleware/upload');

router.use(protect, authorize('admin', 'staff'));

router.get('/customers', c.list);
router.get('/customers/:id', validate(idParam), c.getOne);
router.patch('/customers/:id/block', authorize('admin'), validate(idParam), c.toggleBlock);
router.patch('/customers/:id/role', authorize('admin'), validate({
  ...idParam,
  body: z.object({ role: z.enum(['customer', 'staff', 'admin']) }),
}), c.changeRole);

router.post('/uploads/images', uploader.array('images', 6), upload.images);
router.delete('/uploads/:publicId', authorize('admin'), upload.remove);

module.exports = router;
