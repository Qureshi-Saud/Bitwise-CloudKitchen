'use strict';
const mongoose = require('mongoose');

/**
 * Admin-controlled configuration for the "Build Your Own Snack Box" page.
 * This is explicitly a ONE-TIME box. There are no plans, cycles or renewals
 * anywhere in this schema by design.
 */
const snackBoxConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true, index: true },
    title: { type: String, default: 'Build Your Own Snack Box' },
    subtitle: { type: String, default: 'A one-time box. No plans, no subscription, no auto-renewal.' },
    minItems: { type: Number, default: 2, min: 1 },
    maxItems: { type: Number, default: 8, min: 1 },

    // Per-size discount on the items subtotal (one-time saving, not a plan).
    sizeTiers: {
      type: [
        {
          items: { type: Number, required: true },
          label: { type: String, required: true },
          discountPercent: { type: Number, default: 0, min: 0, max: 50 },
        },
      ],
      default: [],
    },

    extras: {
      type: [
        {
          key: { type: String, required: true, lowercase: true },
          label: { type: String, required: true },
          price: { type: Number, required: true, min: 0 },
          nutritionDelta: {
            calories: { type: Number, default: 0 },
            protein: { type: Number, default: 0 },
            carbs: { type: Number, default: 0 },
            fat: { type: Number, default: 0 },
            fibre: { type: Number, default: 0 },
          },
          isAvailable: { type: Boolean, default: true },
        },
      ],
      default: [],
    },

    packagingFee: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

snackBoxConfigSchema.methods.discountForCount = function discountForCount(count) {
  const applicable = (this.sizeTiers || [])
    .filter((t) => count >= t.items)
    .sort((a, b) => b.items - a.items)[0];
  return applicable ? applicable.discountPercent : 0;
};

module.exports = mongoose.model('SnackBoxConfig', snackBoxConfigSchema);
