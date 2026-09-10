'use strict';
const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const isConfigured = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
const client = isConfigured ? new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret }) : null;

if (!isConfigured) logger.warn('Razorpay is not configured - online payments are disabled.');

/** Creates a Razorpay order for the checkout widget. Amount is in paise. */
async function createCheckoutOrder(order) {
  if (!isConfigured) {
    throw ApiError.badRequest('Online payment is not available right now. Please choose Cash on Delivery.');
  }
  const rzpOrder = await client.orders.create({
    amount: Math.round(order.pricing.total * 100),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderNumber: order.orderNumber, orderId: String(order._id) },
  });

  return {
    id: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: env.razorpay.keyId,
    orderNumber: order.orderNumber,
  };
}

/**
 * Constant-time compare that tolerates a wrong-length candidate. timingSafeEqual
 * throws on a length mismatch, so calling it directly turns an attacker-supplied
 * short signature into an unhandled 500 instead of a clean rejection.
 */
function safeEqual(expected, candidate) {
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(candidate ?? ''));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Verifies the HMAC signature returned by the Razorpay checkout widget. */
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (!isConfigured) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(razorpayOrderId + '|' + razorpayPaymentId)
    .digest('hex');
  return safeEqual(expected, signature);
}

/** Verifies a Razorpay webhook body signature. */
function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.webhookSecret) return false;
  // An empty or non-JSON body never reaches express.json()'s verify hook, so
  // rawBody can legitimately be undefined - that is an unsigned request.
  if (!Buffer.isBuffer(rawBody)) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

async function refund(paymentId, amount) {
  if (!isConfigured) throw ApiError.badRequest('Refunds require Razorpay to be configured');
  return client.payments.refund(paymentId, { amount: Math.round(amount * 100) });
}

module.exports = { createCheckoutOrder, verifyPaymentSignature, verifyWebhookSignature, refund, isConfigured };
