'use strict';
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    subject: {
      type: String,
      enum: ['general', 'order', 'bulk', 'feedback', 'partnership', 'support'],
      default: 'general',
    },
    message: { type: String, required: true, trim: true, maxlength: 1200 },
    status: { type: String, enum: ['new', 'in-progress', 'resolved'], default: 'new', index: true },
    adminNote: { type: String, maxlength: 600 },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
