'use strict';
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 90 },
    comment: { type: String, trim: true, maxlength: 800 },
    images: { type: [{ url: String, publicId: String }], default: [] },
    isVerifiedPurchase: { type: Boolean, default: true },
    status: { type: String, enum: ['published', 'pending', 'hidden'], default: 'published', index: true },
    helpfulCount: { type: Number, default: 0 },
    adminReply: { text: String, at: Date },
  },
  { timestamps: true }
);

// One review per product per order.
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

reviewSchema.statics.recalculateProductRating = async function recalculateProductRating(productId) {
  const [stats] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'published' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await mongoose.model('Product').findByIdAndUpdate(productId, {
    rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    reviewCount: stats ? stats.count : 0,
  });
};

reviewSchema.post('save', function afterSave() {
  this.constructor.recalculateProductRating(this.product).catch(() => {});
});

reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) mongoose.model('Review').recalculateProductRating(doc.product).catch(() => {});
});

module.exports = mongoose.model('Review', reviewSchema);
