'use strict';
const mongoose = require('mongoose');

/** Snack Buddy conversation log - used for analytics and support follow-up. */
const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true, maxlength: 2000 },
    intent: { type: String, maxlength: 60 },
    suggestedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

// Chat transcripts auto-expire after 30 days.
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
