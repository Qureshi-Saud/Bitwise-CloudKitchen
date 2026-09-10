'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const { addressBody, objectId } = require('../validators/common.validator');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const profileBody = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number').optional(),
  dietPreference: z.enum(['veg', 'non-veg', 'both']).optional(),
});

router.use(protect);

router.get('/profile', c.getProfile);
router.patch('/profile', validate({ body: profileBody }), c.updateProfile);
router.post('/avatar', upload.single('image'), c.uploadAvatar);

router.get('/addresses', c.listAddresses);
router.post('/addresses', validate({ body: addressBody }), c.addAddress);
router.put('/addresses/:addressId', validate({ params: z.object({ addressId: objectId }), body: addressBody.partial() }), c.updateAddress);
router.delete('/addresses/:addressId', validate({ params: z.object({ addressId: objectId }) }), c.deleteAddress);

router.post('/favourites/:productId', validate({ params: z.object({ productId: objectId }) }), c.toggleFavourite);

router.get('/notifications', c.listNotifications);
router.patch('/notifications/read-all', c.markAllNotificationsRead);
router.patch('/notifications/:id/read', validate({ params: z.object({ id: objectId }) }), c.markNotificationRead);

router.get('/rewards', c.rewards);

module.exports = router;
