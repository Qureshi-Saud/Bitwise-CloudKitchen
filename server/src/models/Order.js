'use strict';
const crypto = require('crypto');
const mongoose = require('mongoose');

const ORDER_STATUSES = ['Confirmed', 'Preparing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

/**
 * Order items are SNAPSHOTS. Product price, nutrition, image and customization
 * labels are copied at checkout so later catalogue edits never rewrite history.
 */
const orderItemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['product', 'snackbox'], default: 'product' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    slug: String,
    image: String,
    categoryName: String,
    foodType: { type: String, enum: ['veg', 'non-veg'], default: 'veg' },

    basePrice: { type: Number, required: true, min: 0 },
    customizationPrice: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    lineTotal: { type: Number, required: true, min: 0 },

    customizations: {
      type: [
        {
          groupKey: String,
          groupTitle: String,
          selections: [{ label: String, priceDelta: Number }],
        },
      ],
      default: [],
    },

    // Snack box composition (one-time box, never a subscription).
    boxItems: {
      type: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          name: String,
          quantity: Number,
          price: Number,
        },
      ],
      default: [],
    },
    boxExtras: { type: [{ label: String, price: Number }], default: [] },

    nutritionSnapshot: {
      calories: Number, protein: Number, carbs: Number, fat: Number, fibre: Number,
    },
    specialInstructions: { type: String, maxlength: 300 },
  },
  { _id: true }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, maxlength: 200 },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactEmail: { type: String, required: true, lowercase: true },
    contactPhone: { type: String, required: true },

    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'An order must contain at least one item'],
    },

    pricing: {
      itemsTotal: { type: Number, required: true, min: 0 },
      customizationTotal: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },

    coupon: {
      code: { type: String, uppercase: true },
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
      discountValue: Number,
    },

    deliveryAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      landmark: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    deliverySlot: {
      slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliverySlot' },
      date: { type: Date, required: true },
      label: { type: String, required: true },
      startTime: String,
      endTime: String,
    },

    payment: {
      method: { type: String, enum: ['cod', 'upi', 'razorpay'], required: true },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
      refundedAt: Date,
      refundAmount: Number,
    },

    status: { type: String, enum: ORDER_STATUSES, default: 'Confirmed', index: true },
    statusHistory: { type: [statusEventSchema], default: [] },

    estimatedDeliveryAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: { type: String, maxlength: 300 },

    isReviewed: { type: Boolean, default: false },
    customerNote: { type: String, maxlength: 300 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.statics.STATUSES = ORDER_STATUSES;

/**
 * The order number doubles as the lookup key on the public Track Order page, so
 * it has to be unguessable. Four decimal digits gave only 9,000 candidates per
 * day - trivially enumerable - and Math.random() is not a CSPRNG either. Eight
 * characters from a 32-symbol alphabet is ~2^40 of crypto-random search space.
 * Crockford base32 (no I, L, O, U) keeps it readable over the phone.
 */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function orderCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

orderSchema.pre('validate', async function generateOrderNumber(next) {
  if (this.orderNumber) return next();
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  this.orderNumber = `BW-${ymd}-${orderCode()}`;
  next();
});

orderSchema.virtual('totalItems').get(function totalItems() {
  return this.items.reduce((sum, i) => sum + i.quantity, 0);
});

orderSchema.virtual('progressIndex').get(function progressIndex() {
  return ORDER_STATUSES.indexOf(this.status);
});

module.exports = mongoose.model('Order', orderSchema);
