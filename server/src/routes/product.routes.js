'use strict';
const router = require('express').Router();
const c = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const v = require('../validators/product.validator');
const { idParam } = require('../validators/common.validator');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public catalogue
router.get('/', optionalAuth, validate(v.list), c.list);
router.get('/popular', c.popular);
router.get('/search-suggestions', c.suggestions);
router.get('/compare', validate(v.compare), c.compare);
router.post('/:id/customize-preview', validate(v.customizePreview), c.customizePreview);

// Admin (declared before the slug route so they are not swallowed by it)
router.post('/', protect, authorize('admin'), validate(v.create), c.create);
router.get('/admin/:id', protect, authorize('admin', 'staff'), validate(idParam), c.adminGetById);
router.put('/:id', protect, authorize('admin'), validate(v.update), c.update);
router.patch('/:id/availability', protect, authorize('admin', 'staff'), validate(idParam), c.toggleAvailability);
router.delete('/:id', protect, authorize('admin'), validate(idParam), c.remove);

router.get('/:slug', c.getBySlug);

module.exports = router;
