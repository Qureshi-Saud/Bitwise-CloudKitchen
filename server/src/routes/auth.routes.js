'use strict';
const router = require('express').Router();
const c = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const v = require('../validators/auth.validator');
const { protect } = require('../middleware/auth');
const { authLimiter, loginAccountLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, validate(v.register), c.register);
router.post('/login', authLimiter, loginAccountLimiter, validate(v.login), c.login);
router.post('/google', authLimiter, validate(v.googleLogin), c.googleLogin);
router.post('/refresh', authLimiter, c.refresh);
router.post('/logout', c.logout);

router.post('/verify-email', validate(v.verifyEmail), c.verifyEmail);
router.post('/resend-verification', authLimiter, validate(v.resendVerification), c.resendVerification);
router.post('/forgot-password', authLimiter, validate(v.forgotPassword), c.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPassword), c.resetPassword);

router.use(protect);
router.get('/me', c.me);
router.get('/sessions', c.sessions);
router.post('/logout-all', c.logoutAll);
router.patch('/change-password', validate(v.changePassword), c.changePassword);

module.exports = router;
