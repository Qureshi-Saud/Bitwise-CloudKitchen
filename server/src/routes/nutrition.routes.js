'use strict';
const router = require('express').Router();
const c = require('../controllers/nutrition.controller');

router.get('/guide', c.guide);
router.get('/products', c.table);
router.get('/compare', c.compare);

module.exports = router;
