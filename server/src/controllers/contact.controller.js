'use strict';
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { sendMail, templates } = require('../utils/mailer');
const settingsService = require('../services/settings.service');
const { emitTo } = require('../sockets');

/** POST /contact - public contact form. */
exports.submit = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create(req.body);

  sendMail({ to: message.email, ...templates.contactAck(message.name) });
  emitTo('admins', 'contact:new', { id: message._id, name: message.name, subject: message.subject });

  return created(res, {
    message: 'Thanks for writing in! Our team will get back to you within support hours.',
    data: { id: message._id },
  });
});

/** GET /contact/info - phone, email, WhatsApp, timings, socials. */
exports.info = asyncHandler(async (_req, res) => {
  const pub = settingsService.publicShape(await settingsService.get());
  return ok(res, {
    message: 'Contact information',
    data: {
      brand: pub.brandName,
      phone: pub.supportPhone,
      email: pub.supportEmail,
      whatsapp: pub.supportWhatsapp,
      whatsappLink: pub.whatsappLink,
      supportHours: pub.supportHours,
      address: pub.address,
      city: pub.city,
      serviceArea: (pub.serviceAreas || []).join(', '),
      googleMapsEmbed: pub.googleMapsEmbed,
      socials: pub.socials,
    },
  });
});

/* ------------------------------ Admin actions ----------------------------- */

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.query.status ? { status: req.query.status } : {};

  const [items, total, newCount] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({ status: 'new' }),
  ]);

  return ok(res, { message: 'Contact requests', data: items, meta: { ...buildMeta({ page, limit, total }), newCount } });
});

exports.update = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { ...req.body, handledBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!message) throw ApiError.notFound('Contact request not found');
  return ok(res, { message: 'Contact request updated', data: message });
});
