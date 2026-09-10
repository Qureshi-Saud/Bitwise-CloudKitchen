'use strict';
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const razorpayService = require('../services/razorpay.service');
const env = require('../config/env');
const { emitTo } = require('../sockets');
const { notify } = require('../services/notification.service');

/** GET /payments/methods - which payment options the storefront should show. */
exports.methods = asyncHandler(async (_req, res) =>
  ok(res, {
    message: 'Available payment methods',
    data: [
      { id: 'upi', label: 'UPI', description: 'Pay instantly with any UPI app', enabled: razorpayService.isConfigured },
      { id: 'razorpay', label: 'Card / Netbanking / Wallet', description: 'Secure payment via Razorpay', enabled: razorpayService.isConfigured },
      { id: 'cod', label: 'Cash on Delivery', description: 'Pay the delivery partner when your snack arrives', enabled: true },
    ],
  }));

/** POST /payments/:orderId/create - (re)create a Razorpay order for retrying payment. */
exports.createCheckout = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.payment.status === 'paid') throw ApiError.badRequest('This order is already paid');
  if (order.payment.method === 'cod') throw ApiError.badRequest('This is a Cash on Delivery order');

  const checkout = await razorpayService.createCheckoutOrder(order);
  order.payment.razorpayOrderId = checkout.id;
  await order.save();

  return ok(res, { message: 'Checkout session created', data: checkout });
});

/** POST /payments/verify - called by the client after the Razorpay widget succeeds. */
exports.verify = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

  const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId, user: req.user._id });
  if (!order) throw ApiError.notFound('Matching order not found');
  if (order.payment.status === 'paid') return ok(res, { message: 'Payment already confirmed', data: order });

  const valid = razorpayService.verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature });
  if (!valid) {
    order.payment.status = 'failed';
    await order.save();
    throw ApiError.badRequest('Payment verification failed. If money was deducted it will be refunded automatically.');
  }

  order.payment.status = 'paid';
  order.payment.razorpayPaymentId = razorpayPaymentId;
  order.payment.razorpaySignature = signature;
  order.payment.paidAt = new Date();
  await order.save();

  await User.findByIdAndUpdate(order.user, { $inc: { 'stats.totalSpent': order.pricing.total } });

  emitTo('admins', 'order:paid', { orderNumber: order.orderNumber, total: order.pricing.total });
  notify(order.user, {
    title: 'Payment successful',
    body: 'We received Rs. ' + order.pricing.total + ' for order ' + order.orderNumber + '.',
    type: 'order',
    link: '/track-order?order=' + order.orderNumber,
  });

  return ok(res, { message: 'Payment verified successfully', data: order });
});

/** POST /payments/webhook - Razorpay server-to-server confirmation (raw body). */
exports.webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!razorpayService.verifyWebhookSignature(req.rawBody, signature)) {
    throw ApiError.badRequest('Invalid webhook signature');
  }

  const event = req.body?.event;
  const entity = req.body?.payload?.payment?.entity;

  if (event === 'payment.captured' && entity?.order_id) {
    const order = await Order.findOne({ 'payment.razorpayOrderId': entity.order_id });
    if (order && order.payment.status !== 'paid') {
      order.payment.status = 'paid';
      order.payment.razorpayPaymentId = entity.id;
      order.payment.paidAt = new Date();
      await order.save();
      emitTo('user:' + order.user, 'order:paid', { orderNumber: order.orderNumber });
    }
  }

  if (event === 'payment.failed' && entity?.order_id) {
    await Order.findOneAndUpdate({ 'payment.razorpayOrderId': entity.order_id }, { 'payment.status': 'failed' });
  }

  return ok(res, { message: 'Webhook processed' });
});

/** POST /payments/:orderId/refund - admin initiated refund. */
exports.refund = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.payment.status !== 'paid') throw ApiError.badRequest('Only paid orders can be refunded');
  if (order.payment.method === 'cod') throw ApiError.badRequest('Cash on Delivery orders are refunded manually');

  // Never refund more than was actually collected. The amount arrives from the
  // admin panel, and an unbounded value would be sent straight to Razorpay.
  const requested = req.body.amount === undefined ? order.pricing.total : Number(req.body.amount);
  if (!Number.isFinite(requested) || requested <= 0) {
    throw ApiError.badRequest('Enter a valid refund amount');
  }
  if (requested > order.pricing.total) {
    throw ApiError.badRequest('A refund cannot exceed the order total of Rs. ' + order.pricing.total);
  }
  const amount = Math.round(requested * 100) / 100;

  await razorpayService.refund(order.payment.razorpayPaymentId, amount);

  order.payment.status = 'refunded';
  order.payment.refundedAt = new Date();
  order.payment.refundAmount = amount;
  await order.save();

  notify(order.user, {
    title: 'Refund initiated',
    body: 'Rs. ' + amount + ' for order ' + order.orderNumber + ' will reach your account in 3-5 working days.',
    type: 'order',
  });

  return ok(res, { message: 'Refund initiated', data: order });
});

exports.config = asyncHandler(async (_req, res) =>
  ok(res, {
    message: 'Payment configuration',
    data: { razorpayKeyId: env.razorpay.keyId || null, enabled: razorpayService.isConfigured },
  }));
