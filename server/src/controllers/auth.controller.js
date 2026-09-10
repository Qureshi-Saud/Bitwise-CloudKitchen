'use strict';
const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } = require('../utils/cookies');
const { sendMail, templates } = require('../utils/mailer');
const env = require('../config/env');
const authService = require('../services/auth.service');
const { notify } = require('../services/notification.service');

/**
 * Every response that seeds the client's AuthContext populates favourites with
 * this projection - the same one GET /users/profile uses. The Favourites page
 * renders that array as product cards, so bare ObjectIds would render empty.
 */
const FAVOURITE_FIELDS = { path: 'favourites', select: 'name slug price images foodType' };

const hash = (raw) => crypto.createHash('sha256').update(raw).digest('hex');
const getRefreshToken = (req) => req.cookies?.[REFRESH_COOKIE] || req.headers['x-refresh-token'] || req.body?.refreshToken;

async function sendVerificationEmail(user) {
  const raw = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  const link = env.clientUrl + '/verify-email?token=' + raw;
  const tpl = templates.verifyEmail(user.name, link);
  await sendMail({ to: user.email, ...tpl });
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, referralCode } = req.body;

  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');

  const referrer = referralCode ? await User.findOne({ referralCode }) : null;
  const user = await User.create({ name, email, password, phone, referredBy: referrer?._id });

  if (referrer) {
    referrer.rewardPoints += 50;
    await referrer.save({ validateBeforeSave: false });
    notify(referrer._id, {
      title: 'Referral reward earned',
      body: name + ' joined using your referral code. 50 reward points added.',
      type: 'offer',
    });
  }

  await sendVerificationEmail(user);
  const { accessToken, refreshToken } = await authService.issueTokens(user, req);
  setRefreshCookie(res, refreshToken);

  return created(res, {
    message: 'Account created. Please check your email to verify your address.',
    data: { user: user.toJSON(), accessToken },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +passwordChangedAt');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.isBlocked) throw ApiError.forbidden('Your account has been suspended. Please contact support.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await authService.issueTokens(user, req);
  setRefreshCookie(res, refreshToken);

  await user.populate(FAVOURITE_FIELDS.path, FAVOURITE_FIELDS.select);
  return ok(res, { message: 'Signed in successfully', data: { user: user.toJSON(), accessToken } });
});

exports.googleLogin = asyncHandler(async (req, res) => {
  const profile = await authService.verifyGoogleIdToken(req.body.idToken);

  // Google only asserts ownership of an address when email_verified is true.
  // Trusting an unverified one lets somebody create a Google identity carrying
  // a victim's address and have it silently linked to the victim's account.
  if (!profile.emailVerified) {
    throw ApiError.unauthorized('Your Google account email is not verified. Please verify it with Google first.');
  }

  let user = await User.findOne({ $or: [{ googleId: profile.googleId }, { email: profile.email }] });
  if (!user) {
    user = await User.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      provider: 'google',
      isEmailVerified: true,
      avatar: profile.picture ? { url: profile.picture } : undefined,
    });
  } else if (!user.googleId) {
    // Guard against a Google identity claiming an address that already belongs
    // to a different Google account on this platform.
    if (user.email !== profile.email) throw ApiError.unauthorized('This Google account cannot be linked');
    user.googleId = profile.googleId;
    user.isEmailVerified = true;
    if (!user.avatar?.url && profile.picture) user.avatar = { url: profile.picture };
  }
  if (user.isBlocked) throw ApiError.forbidden('Your account has been suspended.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await authService.issueTokens(user, req);
  setRefreshCookie(res, refreshToken);

  await user.populate(FAVOURITE_FIELDS.path, FAVOURITE_FIELDS.select);
  return ok(res, { message: 'Signed in with Google', data: { user: user.toJSON(), accessToken } });
});

exports.refresh = asyncHandler(async (req, res) => {
  const raw = getRefreshToken(req);
  const { accessToken, refreshToken, user } = await authService.rotateRefreshToken(raw, req);
  setRefreshCookie(res, refreshToken);
  await user.populate(FAVOURITE_FIELDS.path, FAVOURITE_FIELDS.select);
  return ok(res, { message: 'Session refreshed', data: { accessToken, user: user.toJSON() } });
});

exports.logout = asyncHandler(async (req, res) => {
  const raw = getRefreshToken(req);
  if (raw) await authService.revokeSession(raw);
  clearRefreshCookie(res);
  return ok(res, { message: 'Signed out from this device' });
});

exports.logoutAll = asyncHandler(async (req, res) => {
  await authService.revokeAllSessions(req.user._id);
  clearRefreshCookie(res);
  return ok(res, { message: 'Signed out from all devices' });
});

exports.sessions = asyncHandler(async (req, res) => {
  const sessions = await authService.listSessions(req.user._id);
  return ok(res, { message: 'Active sessions', data: sessions });
});

exports.me = asyncHandler(async (req, res) => {
  await req.user.populate(FAVOURITE_FIELDS.path, FAVOURITE_FIELDS.select);
  return ok(res, { message: 'Current user', data: { user: req.user.toJSON() } });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    emailVerificationToken: hash(req.body.token),
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) throw ApiError.badRequest('This verification link is invalid or has expired');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  notify(user._id, {
    title: 'Email verified',
    body: 'Your email is verified. Enjoy fresh, healthy snacking!',
    type: 'account',
  });

  return ok(res, { message: 'Email verified successfully', data: { user: user.toJSON() } });
});

exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+emailVerificationToken +emailVerificationExpires');
  if (user && !user.isEmailVerified) await sendVerificationEmail(user);
  // Always the same response so the endpoint cannot be used to enumerate accounts.
  return ok(res, { message: 'If that account exists and is unverified, a new link has been sent.' });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordResetToken +passwordResetExpires');

  if (user && user.provider === 'local') {
    const raw = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const link = env.clientUrl + '/reset-password?token=' + raw;
    await sendMail({ to: user.email, ...templates.resetPassword(user.name, link) });
  }

  return ok(res, { message: 'If that account exists, a password reset link has been sent.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    passwordResetToken: hash(req.body.token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +password');

  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Force every device to sign in again after a password reset.
  await authService.revokeAllSessions(user._id);
  clearRefreshCookie(res);

  return ok(res, { message: 'Password updated. Please sign in with your new password.' });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user.password) throw ApiError.badRequest('Your account uses Google sign-in and has no password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Your current password is incorrect');
  }

  user.password = req.body.newPassword;
  await user.save();

  await authService.revokeAllSessions(user._id);
  const { accessToken, refreshToken } = await authService.issueTokens(user, req);
  setRefreshCookie(res, refreshToken);

  return ok(res, {
    message: 'Password changed. Other devices have been signed out.',
    data: { accessToken },
  });
});
