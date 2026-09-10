'use strict';
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20, index: true },
    description: { type: String, trim: true, maxlength: 200 },
    discountType: { type: String, enum: ['percent', 'flat'], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    maxDiscount: { type: Number, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    usedBy: { type: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, count: Number }], default: [] },
    firstOrderOnly: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

couponSchema.virtual('isExpired').get(function isExpired() {
  return this.expiresAt < new Date();
});

couponSchema.methods.computeDiscount = function computeDiscount(subtotal) {
  const raw = this.discountType === 'percent' ? (subtotal * this.discountValue) / 100 : this.discountValue;
  const capped = this.maxDiscount ? Math.min(raw, this.maxDiscount) : raw;
  return Math.max(0, Math.min(Math.round(capped), subtotal));
};

module.exports = mongoose.model('Coupon', couponSchema);
