'use strict';
const Review = require('../models/Review');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notify } = require('../services/notification.service');

/** GET /reviews/product/:productId */
exports.listForProduct = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { product: req.params.productId, status: 'published' };

  const [items, total, breakdown] = await Promise.all([
    Review.find(filter).populate('user', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { ...filter, product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  return ok(res, {
    message: 'Reviews',
    data: items,
    meta: { ...buildMeta({ page, limit, total }), breakdown: Object.fromEntries(breakdown.map((b) => [b._id, b.count])) },
  });
});

/** GET /reviews/pending - products from delivered orders the user has not rated. */
exports.pending = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id, status: 'Delivered' })
    .select('orderNumber items deliveredAt')
    .sort({ deliveredAt: -1 })
    .limit(20)
    .lean();

  const existing = await Review.find({ user: req.user._id }).select('product order').lean();
  const done = new Set(existing.map((r) => String(r.product) + ':' + String(r.order)));

  const pendingItems = [];
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.product || item.kind !== 'product') continue;
      if (done.has(String(item.product) + ':' + String(order._id))) continue;
      pendingItems.push({
        orderId: order._id,
        orderNumber: order.orderNumber,
        productId: item.product,
        name: item.name,
        image: item.image,
        deliveredAt: order.deliveredAt,
      });
    }
  }

  return ok(res, { message: 'Snacks waiting for your review', data: pendingItems });
});

/** POST /reviews - only after the order has been delivered. */
exports.create = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, title, comment } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== 'Delivered') throw ApiError.badRequest('You can review a snack once the order is delivered');

  const bought = order.items.some((i) => String(i.product) === String(productId));
  if (!bought) throw ApiError.badRequest('This snack was not part of that order');

  if (await Review.exists({ user: req.user._id, product: productId, order: orderId })) {
    throw ApiError.conflict('You have already reviewed this snack for that order');
  }

  const review = await Review.create({
    user: req.user._id, product: productId, order: orderId, rating, title, comment,
  });

  if (!order.isReviewed) {
    order.isReviewed = true;
    await order.save();
  }

  return created(res, { message: 'Thanks for your review!', data: review });
});

exports.update = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');

  Object.assign(review, {
    rating: req.body.rating ?? review.rating,
    title: req.body.title ?? review.title,
    comment: req.body.comment ?? review.comment,
  });
  await review.save();

  return ok(res, { message: 'Review updated', data: review });
});

exports.remove = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const review = await Review.findOneAndDelete(filter);
  if (!review) throw ApiError.notFound('Review not found');
  return ok(res, { message: 'Review removed' });
});

exports.myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 })
    .lean();
  return ok(res, { message: 'Your reviews', data: reviews });
});

/* ------------------------------ Admin actions ----------------------------- */

exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const [items, total] = await Promise.all([
    Review.find(filter).populate('user', 'name email').populate('product', 'name slug')
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
  ]);

  return ok(res, { message: 'Reviews', data: items, meta: buildMeta({ page, limit, total }) });
});

exports.moderate = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  if (req.body.status) review.status = req.body.status;
  if (req.body.reply) review.adminReply = { text: req.body.reply, at: new Date() };
  await review.save();
  await Review.recalculateProductRating(review.product);

  if (req.body.reply) {
    notify(review.user, {
      title: 'The kitchen replied to your review',
      body: req.body.reply.slice(0, 160),
      type: 'review',
    });
  }

  return ok(res, { message: 'Review updated', data: review });
});
