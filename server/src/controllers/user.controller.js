'use strict';
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { uploadBuffer, destroy, isConfigured } = require('../config/cloudinary');
const env = require('../config/env');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favourites', 'name slug price images foodType');
  return ok(res, { message: 'Profile', data: user.toJSON() });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'dietPreference'];
  const patch = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  const user = await User.findByIdAndUpdate(req.user._id, patch, { new: true, runValidators: true });
  return ok(res, { message: 'Profile updated', data: user.toJSON() });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!isConfigured) throw ApiError.badRequest('Image uploads are not configured on this server');
  if (!req.file) throw ApiError.badRequest('Please choose an image');

  const user = await User.findById(req.user._id);
  if (user.avatar?.publicId) await destroy(user.avatar.publicId);

  const uploaded = await uploadBuffer(req.file.buffer, { folder: env.cloudinary.folder + '/avatars' });
  user.avatar = { url: uploaded.url, publicId: uploaded.publicId };
  await user.save({ validateBeforeSave: false });

  return ok(res, { message: 'Profile photo updated', data: user.toJSON() });
});

/* -------------------------------- Addresses ------------------------------- */

exports.listAddresses = asyncHandler(async (req, res) =>
  ok(res, { message: 'Saved addresses', data: req.user.addresses }));

exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= 8) throw ApiError.badRequest('You can save up to 8 addresses');

  if (req.body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  user.addresses.push({ ...req.body, isDefault: req.body.isDefault || user.addresses.length === 0 });
  await user.save();

  return created(res, { message: 'Address saved', data: user.addresses });
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  if (req.body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  address.set(req.body);
  await user.save();

  return ok(res, { message: 'Address updated', data: user.addresses });
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();

  return ok(res, { message: 'Address removed', data: user.addresses });
});

/* ------------------------------- Favourites ------------------------------- */

exports.toggleFavourite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const id = req.params.productId;
  const index = user.favourites.findIndex((f) => String(f) === id);

  if (index >= 0) user.favourites.splice(index, 1);
  else user.favourites.push(id);
  await user.save({ validateBeforeSave: false });

  return ok(res, { message: index >= 0 ? 'Removed from favourites' : 'Added to favourites', data: user.favourites });
});

/* ------------------------------ Notifications ----------------------------- */

exports.listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  return ok(res, { message: 'Notifications', data: items, meta: { ...buildMeta({ page, limit, total }), unread } });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { isRead: true, readAt: new Date() });
  return ok(res, { message: 'Notification marked as read' });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  return ok(res, { message: 'All notifications marked as read' });
});

/* --------------------------------- Rewards -------------------------------- */

exports.rewards = asyncHandler(async (req, res) => {
  const referrals = await User.countDocuments({ referredBy: req.user._id });
  return ok(res, {
    message: 'Rewards and referrals',
    data: {
      referralCode: req.user.referralCode,
      rewardPoints: req.user.rewardPoints,
      referrals,
      howItWorks: [
        'Share your referral code with a friend.',
        'They get a welcome discount on their first snack order.',
        'You earn 50 reward points once they sign up.',
      ],
    },
  });
});
