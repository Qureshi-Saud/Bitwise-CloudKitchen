'use strict';
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const pricing = require('../services/pricing.service');

/** GET /coupons/available - public offers strip + "apply coupon" suggestions. */
exports.available = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true, isPublic: true, startsAt: { $lte: now }, expiresAt: { $gt: now },
  })
    .select('code description discountType discountValue maxDiscount minOrderValue expiresAt firstOrderOnly')
    .sort({ minOrderValue: 1 })
    .lean();

  const usable = req.user
    ? coupons.filter((c) => !(c.firstOrderOnly && (req.user.stats?.totalOrders || 0) > 0))
    : coupons;

  return ok(res, { message: 'Available offers', data: usable });
});

/** POST /coupons/validate - checks a code against the live cart subtotal. */
exports.validate = asyncHandler(async (req, res) => {
  const { discount, coupon } = await pricing.applyCoupon(req.body.code, Number(req.body.subtotal), req.user);
  return ok(res, {
    message: 'Coupon applied',
    data: { code: coupon.code, description: coupon.description, discount },
  });
});

/* ------------------------------ Admin actions ----------------------------- */

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    Coupon.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Coupon.countDocuments({}),
  ]);
  return ok(res, { message: 'Coupons', data: items, meta: buildMeta({ page, limit, total }) });
});

exports.create = asyncHandler(async (req, res) => {
  if (await Coupon.exists({ code: req.body.code })) throw ApiError.conflict('This coupon code already exists');
  const coupon = await Coupon.create(req.body);
  return created(res, { message: 'Coupon created', data: coupon });
});

exports.update = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return ok(res, { message: 'Coupon updated', data: coupon });
});

exports.remove = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return ok(res, { message: 'Coupon deleted' });
});
