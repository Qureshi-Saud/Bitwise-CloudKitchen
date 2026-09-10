'use strict';
const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { revokeAllSessions } = require('../services/auth.service');

/** GET /admin/customers */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.blocked) filter.isBlocked = req.query.blocked === 'true';
  if (req.query.search) {
    const safe = String(req.query.search).replace(/[^a-zA-Z0-9 @.-]/g, '');
    filter.$or = [{ name: new RegExp(safe, 'i') }, { email: new RegExp(safe, 'i') }, { phone: new RegExp(safe, 'i') }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return ok(res, { message: 'Customers', data: items, meta: buildMeta({ page, limit, total }) });
});

/** GET /admin/customers/:id - profile plus recent orders. */
exports.getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Customer not found');

  const orders = await Order.find({ user: user._id })
    .select('orderNumber status pricing.total createdAt payment.status')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return ok(res, { message: 'Customer details', data: { user: user.toJSON(), orders } });
});

/** PATCH /admin/customers/:id/block */
exports.toggleBlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Customer not found');
  if (user.role === 'admin') throw ApiError.forbidden('Admin accounts cannot be blocked');

  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });
  if (user.isBlocked) await revokeAllSessions(user._id);

  return ok(res, { message: user.isBlocked ? 'Customer blocked' : 'Customer unblocked', data: user.toJSON() });
});

/** PATCH /admin/customers/:id/role */
exports.changeRole = asyncHandler(async (req, res) => {
  // An admin demoting themselves - or the only remaining admin being demoted -
  // locks everyone out of the panel with no in-app way back.
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change your own role');
  }

  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('Customer not found');

  if (target.role === 'admin' && req.body.role !== 'admin') {
    const admins = await User.countDocuments({ role: 'admin' });
    if (admins <= 1) throw ApiError.badRequest('At least one admin account must remain');
  }

  target.role = req.body.role;
  await target.save({ validateBeforeSave: false });

  // A demotion must not leave a still-valid access token carrying the old role.
  if (target.role !== 'admin') await revokeAllSessions(target._id);

  return ok(res, { message: 'Role updated', data: target.toJSON() });
});
