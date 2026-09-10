'use strict';
const ChatMessage = require('../models/ChatMessage');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const chatbot = require('../services/chatbot.service');
const settingsService = require('../services/settings.service');

/** POST /chatbot/message - Snack Buddy. */
exports.message = asyncHandler(async (req, res) => {
  const { text, sessionId } = req.body;
  const answer = await chatbot.respond(text, req.user);

  // Log asynchronously; a logging failure must never break the reply.
  Promise.all([
    ChatMessage.create({ sessionId, user: req.user?._id, role: 'user', text, intent: answer.intent }),
    ChatMessage.create({
      sessionId,
      user: req.user?._id,
      role: 'assistant',
      text: answer.reply.slice(0, 2000),
      intent: answer.intent,
      suggestedProducts: answer.products.map((p) => p._id),
    }),
  ]).catch(() => {});

  return ok(res, { message: 'Snack Buddy reply', data: answer });
});

/** GET /chatbot/welcome - greeting + starter chips for the widget. */
exports.welcome = asyncHandler(async (req, res) =>
  ok(res, {
    message: 'Snack Buddy',
    data: {
      name: 'Snack Buddy',
      greeting:
        'Hi' + (req.user?.name ? ' ' + req.user.name.split(' ')[0] : '') +
        '! I am Snack Buddy. Ask me about the menu, ingredients, nutrition, prices, customization, delivery or your order.',
      disclaimer: chatbot.NUTRITION_DISCLAIMER,
      suggestions: [
        'Show me high protein snacks',
        'What is under Rs. 150?',
        'Which snacks are oats based?',
        'How do I customize a wrap?',
        'What is a snack box?',
        'Track my order',
      ],
      brand: settingsService.snapshot().general.siteName,
    },
  }));

/**
 * GET /chatbot/history?sessionId=
 *
 * sessionId is required. Mongoose strips undefined values out of a filter, so
 * `find({ sessionId: undefined })` used to degrade into `find({})` and hand an
 * unauthenticated caller the transcripts of every visitor. A signed-in caller
 * is additionally pinned to their own user id, so guessing another visitor's
 * session id is not enough to read their conversation.
 */
exports.history = asyncHandler(async (req, res) => {
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId.trim() : '';
  if (sessionId.length < 6 || sessionId.length > 60) {
    throw ApiError.badRequest('A valid session id is required');
  }

  const filter = { sessionId };
  // Messages logged while signed in belong to that account; a guest may only
  // read the messages that were logged without a user attached.
  filter.user = req.user ? req.user._id : { $exists: false };

  const messages = await ChatMessage.find(filter)
    .sort({ createdAt: 1 })
    .limit(50)
    .select('role text createdAt')
    .lean();
  return ok(res, { message: 'Conversation history', data: messages });
});
