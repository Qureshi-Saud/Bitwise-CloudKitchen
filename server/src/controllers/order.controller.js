'use strict';
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const DeliverySlot = require('../models/DeliverySlot');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const pricing = require('../services/pricing.service');
const settingsService = require('../services/settings.service');
const { emitTo } = require('../sockets');
const { notify, notifyAdmins } = require('../services/notification.service');
const { sendMail, templates } = require('../utils/mailer');
const razorpayService = require('../services/razorpay.service');

const STATUS_FLOW = ['Confirmed', 'Preparing', 'Packed', 'Out for Delivery', 'Delivered'];

/** POST /orders/quote - live cart totals without creating an order. */
exports.quote = asyncHandler(async (req, res) => {
  const cart = await pricing.buildCart(req.body.items);
  const { discount, coupon } = await pricing.applyCoupon(req.body.couponCode, cart.subtotal, req.user);
  const totals = await pricing.computeTotals({ ...cart, discount });
  const { commerce } = await settingsService.get();

  return ok(res, {
    message: 'Cart quote',
    data: {
      ...totals,
      nutritionTotal: cart.nutritionTotal,
      coupon: coupon ? { code: coupon.code, description: coupon.description, discount } : null,
      config: {
        minOrderValue: commerce.minOrderValue,
        deliveryFee: commerce.deliveryFee,
        freeDeliveryAbove: commerce.freeDeliveryAbove,
        taxPercent: commerce.taxPercent,
      },
    },
  });
});

/** POST /orders - creates the order (Discover -> ... -> Pay step). */
exports.create = asyncHandler(async (req, res) => {
  const { items, couponCode, addressId, address, slotId, deliveryDate, paymentMethod, customerNote } = req.body;

  const slot = await DeliverySlot.findOne({ _id: slotId, isActive: true });
  if (!slot) throw ApiError.badRequest('Please choose an available delivery slot');

  const date = new Date(deliveryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) throw ApiError.badRequest('Delivery date cannot be in the past');

  const deliveryAddress = addressId
    ? req.user.addresses.id(addressId)
    : address;
  if (!deliveryAddress) throw ApiError.badRequest('Please select a valid delivery address');

  const cart = await pricing.buildCart(items);
  const { commerce } = await settingsService.get();
  if (cart.subtotal < commerce.minOrderValue) {
    throw ApiError.badRequest('Minimum order value is Rs. ' + commerce.minOrderValue);
  }

  const { discount, coupon } = await pricing.applyCoupon(couponCode, cart.subtotal, req.user);
  const totals = await pricing.computeTotals({ ...cart, discount });

  const estimatedDeliveryAt = new Date(date);
  const [h, m] = String(slot.endTime).split(':').map(Number);
  estimatedDeliveryAt.setHours(h, m, 0, 0);

  const order = await Order.create({
    user: req.user._id,
    contactEmail: req.user.email,
    contactPhone: deliveryAddress.phone || req.user.phone,
    items: totals.items,
    pricing: {
      itemsTotal: totals.itemsTotal,
      customizationTotal: totals.customizationTotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
    },
    coupon: coupon ? { code: coupon.code, couponId: coupon._id, discountValue: discount } : undefined,
    deliveryAddress: {
      fullName: deliveryAddress.fullName,
      phone: deliveryAddress.phone,
      line1: deliveryAddress.line1,
      line2: deliveryAddress.line2,
      landmark: deliveryAddress.landmark,
      city: deliveryAddress.city,
      state: deliveryAddress.state,
      pincode: deliveryAddress.pincode,
    },
    deliverySlot: { slotId: slot._id, date, label: slot.label, startTime: slot.startTime, endTime: slot.endTime },
    payment: { method: paymentMethod, status: 'pending' },
    status: 'Confirmed',
    statusHistory: [{ status: 'Confirmed', note: 'Order placed', at: new Date() }],
    estimatedDeliveryAt,
    customerNote,
  });

  // Cash on delivery is confirmed immediately; online payment waits for verification.
  let checkout = null;
  if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
    checkout = await razorpayService.createCheckoutOrder(order);
    order.payment.razorpayOrderId = checkout.id;
    await order.save();
  }

  await finaliseCouponAndStats({ order, coupon, user: req.user, countPaid: paymentMethod === 'cod' });

  emitTo('admins', 'order:new', { orderId: order._id, orderNumber: order.orderNumber, total: order.pricing.total });
  notifyAdmins('admin:refresh', { scope: 'orders' });
  notify(req.user._id, {
    title: 'Order ' + order.orderNumber + ' confirmed',
    body: 'We have started getting your snacks ready.',
    type: 'order',
    link: '/track-order?order=' + order.orderNumber,
  });
  sendMail({ to: order.contactEmail, ...templates.orderPlaced(req.user.name, order) });

  return created(res, { message: 'Order placed successfully', data: { order, checkout } });
});

async function finaliseCouponAndStats({ order, coupon, user, countPaid }) {
  if (coupon) {
    // Read-modify-write on the loaded document let concurrent checkouts each
    // see the pre-increment count and blow past usageLimit / perUserLimit. The
    // counters are now bumped with conditional atomic updates instead, so the
    // database - not the request - decides who gets the last redemption.
    const alreadyUsed = coupon.usedBy.some((u) => String(u.user) === String(user._id));

    const globalGuard = coupon.usageLimit
      ? { usedCount: { $lt: coupon.usageLimit } }
      : {};
    const perUserGuard = alreadyUsed
      ? { usedBy: { $elemMatch: { user: user._id, count: { $lt: coupon.perUserLimit } } } }
      // Also rejects a concurrent first redemption by the same user, which would
      // otherwise push a second usedBy entry and reset their per-user count.
      : { 'usedBy.user': { $ne: user._id } };

    const update = alreadyUsed
      ? { $inc: { usedCount: 1, 'usedBy.$[entry].count': 1 } }
      : { $inc: { usedCount: 1 }, $push: { usedBy: { user: user._id, count: 1 } } };

    const options = alreadyUsed
      ? { arrayFilters: [{ 'entry.user': user._id }] }
      : {};

    const claimed = await Coupon.findOneAndUpdate(
      { _id: coupon._id, isActive: true, ...globalGuard, ...perUserGuard },
      update,
      { ...options, new: true }
    );

    if (!claimed) {
      // Somebody else took the last redemption between validation and checkout.
      await Order.deleteOne({ _id: order._id });
      throw ApiError.conflict('This coupon has just been fully redeemed. Please place the order again without it.');
    }
  }

  await User.findByIdAndUpdate(user._id, {
    $inc: { 'stats.totalOrders': 1, 'stats.totalSpent': countPaid ? order.pricing.total : 0 },
  });

  const bulk = order.items
    .filter((i) => i.product)
    .map((i) => ({ updateOne: { filter: { _id: i.product }, update: { $inc: { soldCount: i.quantity } } } }));
  if (bulk.length) await Product.bulkWrite(bulk);
}

/** GET /orders/my - customer order history. */
exports.myOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);

  return ok(res, { message: 'Your orders', data: items, meta: buildMeta({ page, limit, total }) });
});

/** GET /orders/:id - a single order the customer owns. */
exports.getOne = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === 'customer') filter.user = req.user._id;

  const order = await Order.findOne(filter).populate('user', 'name email phone').lean({ virtuals: true });
  if (!order) throw ApiError.notFound('Order not found');

  return ok(res, { message: 'Order details', data: order });
});

const maskTail = (value, keep = 4) => {
  const s = String(value || '');
  return s.length <= keep ? s : '*'.repeat(s.length - keep) + s.slice(-keep);
};

/**
 * Anyone holding the order number can see the delivery progress, but only the
 * owner (or the kitchen) sees who it is going to and where. Without this a
 * single leaked or shared order number hands over a customer's full name,
 * phone number and home address.
 */
const redactAddress = (address = {}) => ({
  fullName: String(address.fullName || '').split(' ')[0],
  phone: maskTail(address.phone),
  line1: 'Hidden - sign in to view the full address',
  line2: undefined,
  landmark: undefined,
  city: address.city,
  state: address.state,
  pincode: address.pincode,
});

/** GET /orders/track/:orderNumber - Track Order page (works for the owner). */
exports.track = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() }).lean({ virtuals: true });
  if (!order) throw ApiError.notFound('We could not find an order with that number');

  const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
  const isOwner = Boolean(req.user) && String(order.user) === String(req.user._id);
  if (req.user && !isStaff && !isOwner) {
    throw ApiError.forbidden('This order belongs to another account');
  }
  const canSeePersonalDetails = isOwner || isStaff;

  const timeline = STATUS_FLOW.map((status, index) => {
    const event = order.statusHistory.find((h) => h.status === status);
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    return {
      status,
      index,
      isDone: order.status !== 'Cancelled' && index <= currentIndex,
      isCurrent: order.status === status,
      at: event?.at || null,
      note: event?.note || null,
    };
  });

  return ok(res, {
    message: 'Order tracking',
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      isCancelled: order.status === 'Cancelled',
      cancellationReason: order.cancellationReason,
      placedAt: order.createdAt,
      estimatedDeliveryAt: order.estimatedDeliveryAt,
      deliveredAt: order.deliveredAt,
      deliverySlot: order.deliverySlot,
      deliveryAddress: canSeePersonalDetails ? order.deliveryAddress : redactAddress(order.deliveryAddress),
      isRedacted: !canSeePersonalDetails,
      items: order.items,
      pricing: order.pricing,
      payment: { method: order.payment.method, status: order.payment.status },
      timeline,
    },
  });
});

/** PATCH /orders/:id/cancel - allowed before the food is packed. */
exports.cancel = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (['Packed', 'Out for Delivery', 'Delivered'].includes(order.status)) {
    throw ApiError.badRequest('This order is already ' + order.status.toLowerCase() + ' and can no longer be cancelled');
  }
  if (order.status === 'Cancelled') throw ApiError.badRequest('This order is already cancelled');

  order.status = 'Cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = req.body.reason;
  order.statusHistory.push({ status: 'Cancelled', note: req.body.reason, at: new Date(), by: req.user._id });
  await order.save();

  emitTo('order:' + order.orderNumber, 'order:status', { orderNumber: order.orderNumber, status: order.status });
  emitTo('user:' + order.user, 'order:status', { orderNumber: order.orderNumber, status: order.status });
  notifyAdmins('admin:refresh', { scope: 'orders' });

  return ok(res, { message: 'Order cancelled', data: order });
});

/* ------------------------------ Admin actions ----------------------------- */

/** GET /orders - admin order queue with search and filters. */
exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter['payment.status'] = req.query.paymentStatus;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = req.query.from;
    if (req.query.to) filter.createdAt.$lte = req.query.to;
  }
  if (req.query.search) {
    const safe = String(req.query.search).replace(/[^a-zA-Z0-9 @.-]/g, '');
    filter.$or = [
      { orderNumber: new RegExp(safe, 'i') },
      { contactEmail: new RegExp(safe, 'i') },
      { contactPhone: new RegExp(safe, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);

  return ok(res, { message: 'Orders', data: items, meta: buildMeta({ page, limit, total }) });
});

/**
 * PATCH /orders/:id/status
 * Confirmed -> Preparing -> Packed -> Out for Delivery -> Delivered.
 * The change is pushed live to the customer's Track Order page.
 */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status === 'Delivered') throw ApiError.badRequest('This order is already delivered');
  if (order.status === 'Cancelled') throw ApiError.badRequest('This order was cancelled');

  if (status !== 'Cancelled') {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const nextIndex = STATUS_FLOW.indexOf(status);
    if (nextIndex < currentIndex) throw ApiError.badRequest('Order status cannot move backwards');
  }

  order.status = status;
  order.statusHistory.push({ status, note, at: new Date(), by: req.user._id });

  if (status === 'Delivered') {
    order.deliveredAt = new Date();
    if (order.payment.method === 'cod' && order.payment.status === 'pending') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
    }
  }
  if (status === 'Cancelled') {
    order.cancelledAt = new Date();
    order.cancellationReason = note || 'Cancelled by the kitchen';
  }
  await order.save();

  const payload = {
    orderNumber: order.orderNumber,
    status: order.status,
    updatedAt: new Date(),
    timelineIndex: STATUS_FLOW.indexOf(order.status),
  };
  emitTo('order:' + order.orderNumber, 'order:status', payload);
  emitTo('user:' + order.user._id, 'order:status', payload);

  notify(order.user._id, {
    title: 'Order ' + order.orderNumber + ' is now ' + status,
    body: STATUS_COPY[status] || 'Your order status has been updated.',
    type: 'order',
    link: '/track-order?order=' + order.orderNumber,
  });
  sendMail({ to: order.contactEmail, ...templates.orderStatus(order.user.name, order) });

  return ok(res, { message: 'Order status updated', data: order });
});

const STATUS_COPY = {
  Confirmed: 'We have received your order.',
  Preparing: 'Our kitchen is preparing your snacks fresh right now.',
  Packed: 'Your snacks are packed and ready to leave the kitchen.',
  'Out for Delivery': 'Your order is on the way. Keep your phone handy!',
  Delivered: 'Delivered. Enjoy your healthy snack and do rate your order!',
  Cancelled: 'Your order has been cancelled.',
};

/** GET /orders/stats - admin dashboard tiles. */
exports.stats = asyncHandler(async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totals, today, byStatus, topProducts] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.kind': 'product' } },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { quantity: -1 } },
      { $limit: 6 },
    ]),
  ]);

  const [customers, products] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isAvailable: true }),
  ]);

  return ok(res, {
    message: 'Dashboard stats',
    data: {
      totalOrders: totals[0]?.orders || 0,
      totalRevenue: totals[0]?.revenue || 0,
      todayOrders: today[0]?.orders || 0,
      todayRevenue: today[0]?.revenue || 0,
      customers,
      activeProducts: products,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      topProducts,
    },
  });
});
