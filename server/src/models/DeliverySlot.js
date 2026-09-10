'use strict';
const mongoose = require('mongoose');

const deliverySlotSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    startTime: { type: String, required: true, match: [/^\d{2}:\d{2}$/, 'Use HH:mm format'] },
    endTime: { type: String, required: true, match: [/^\d{2}:\d{2}$/, 'Use HH:mm format'] },
    capacity: { type: Number, default: 40, min: 1 },
    cutoffMinutes: { type: Number, default: 60, min: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

deliverySlotSchema.index({ order: 1, startTime: 1 });

module.exports = mongoose.model('DeliverySlot', deliverySlotSchema);
