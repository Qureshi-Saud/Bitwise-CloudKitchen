'use strict';
const router = require('express').Router();
const c = require('../controllers/settings.controller');
const validate = require('../middleware/validate');
const { settingsBody } = require('../validators/settings.validator');
const { protect, authorize } = require('../middleware/auth');

router.get('/', c.publicSettings);

router.use(protect, authorize('admin'));
router.get('/admin', c.adminSettings);
router.put('/admin', validate({ body: settingsBody }), c.updateSettings);

module.exports = router;
