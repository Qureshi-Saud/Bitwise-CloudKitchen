'use strict';
const DeliverySlot = require('../models/DeliverySlot');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const settingsService = require('../services/settings.service');

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

/**
 * GET /delivery/slots?date=YYYY-MM-DD
 * Returns slots with live remaining capacity, hiding slots whose cutoff has passed today.
 */
exports.slots = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const isToday = dayStart.toDateString() === new Date().toDateString();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const [slots, booked] = await Promise.all([
    DeliverySlot.find({ isActive: true }).sort({ order: 1, startTime: 1 }).lean(),
    Order.aggregate([
      { $match: { 'deliverySlot.date': { $gte: dayStart, $lte: dayEnd }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: '$deliverySlot.slotId', count: { $sum: 1 } } },
    ]),
  ]);

  const bookedMap = new Map(booked.map((b) => [String(b._id), b.count]));

  const data = slots.map((slot) => {
    const used = bookedMap.get(String(slot._id)) || 0;
    const remaining = Math.max(slot.capacity - used, 0);
    const cutoffPassed = isToday && nowMinutes > toMinutes(slot.startTime) - slot.cutoffMinutes;
    return {
      _id: slot._id,
      label: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      remaining,
      isAvailable: remaining > 0 && !cutoffPassed,
      reason: cutoffPassed ? 'Ordering window closed for today' : remaining === 0 ? 'Fully booked' : null,
    };
  });

  return ok(res, { message: 'Delivery slots', data, meta: { date: dayStart } });
});

/** GET /delivery/info - service area, fees and timings for the storefront. */
exports.info = asyncHandler(async (_req, res) => {
  const settings = await settingsService.get();
  return ok(res, {
    message: 'Delivery information',
    data: {
      deliveryFee: settings.commerce.deliveryFee,
      freeDeliveryAbove: settings.commerce.freeDeliveryAbove,
      minOrderValue: settings.commerce.minOrderValue,
      taxPercent: settings.commerce.taxPercent,
      supportHours: settings.general.supportHours,
      serviceAreas: settings.general.serviceAreas,
      city: settings.general.city,
    },
  });
});

/* ------------------------------ Admin actions ----------------------------- */

exports.list = asyncHandler(async (_req, res) => {
  const slots = await DeliverySlot.find({}).sort({ order: 1, startTime: 1 }).lean();
  return ok(res, { message: 'Delivery slots', data: slots });
});

exports.create = asyncHandler(async (req, res) => {
  const slot = await DeliverySlot.create(req.body);
  return created(res, { message: 'Delivery slot created', data: slot });
});

exports.update = asyncHandler(async (req, res) => {
  const slot = await DeliverySlot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!slot) throw ApiError.notFound('Delivery slot not found');
  return ok(res, { message: 'Delivery slot updated', data: slot });
});

exports.remove = asyncHandler(async (req, res) => {
  const slot = await DeliverySlot.findByIdAndDelete(req.params.id);
  if (!slot) throw ApiError.notFound('Delivery slot not found');
  return ok(res, { message: 'Delivery slot deleted' });
});
