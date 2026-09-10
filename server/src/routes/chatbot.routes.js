'use strict';
const router = require('express').Router();
const { z } = require('zod');
const c = require('../controllers/chatbot.controller');
const validate = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Snack Buddy needs a short breather. Please try again in a minute.' },
});

const messageBody = z.object({
  text: z.string().trim().min(1, 'Type a message').max(500),
  sessionId: z.string().trim().min(6).max(60),
});

router.get('/welcome', optionalAuth, c.welcome);
router.get('/history', optionalAuth, c.history);
router.post('/message', chatLimiter, optionalAuth, validate({ body: messageBody }), c.message);

module.exports = router;
