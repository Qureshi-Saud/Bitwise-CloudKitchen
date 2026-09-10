'use strict';
const Settings = require('../models/Settings');
const logger = require('../config/logger');

/**
 * Business settings, cached in process.
 *
 * Two accessors on purpose:
 *   get()      - async, guarantees a fresh-enough document (request handlers).
 *   snapshot() - sync, returns the last loaded copy (mailer templates, pricing
 *                maths and other call sites that cannot be made async).
 *
 * The cache is warmed on boot and invalidated whenever an admin saves, so the
 * sync snapshot is only ever stale between the write and the next read of a
 * different process - acceptable for copy, and the money rules are re-read
 * through get() on every order.
 */

/** Shape returned before the database has ever been reached. */
const FALLBACK = {
  general: {
    siteName: '',
    tagline: '',
    contactEmail: '',
    contactNumber: '',
    whatsappNumber: '',
    companyAddress: '',
    city: '',
    serviceAreas: [],
    supportHours: '',
    googleMapsEmbed: '',
  },
  seo: { metaTitle: '', metaDescription: '', metaKeywords: '' },
  branding: { logoUrl: '', faviconUrl: '' },
  commerce: { minOrderValue: 0, deliveryFee: 0, freeDeliveryAbove: 0, taxPercent: 0 },
  social: { instagram: '', facebook: '', twitter: '', linkedin: '', youtube: '' },
};

let cache = null;
let inflight = null;

const plain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

/** Reads (and creates on first run) the singleton document. */
async function load() {
  if (inflight) return inflight;

  inflight = (async () => {
    let doc = await Settings.findOne({ key: 'default' });
    if (!doc) doc = await Settings.create({ key: 'default' });
    cache = plain(doc);
    return cache;
  })()
    .catch((err) => {
      logger.error('Could not load business settings: ' + err.message);
      return cache || FALLBACK;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Async accessor - always safe, hits the database only when the cache is cold. */
async function get() {
  return cache || load();
}

/** Sync accessor for call sites that cannot await. Never throws. */
function snapshot() {
  return cache || FALLBACK;
}

/** Warms the cache at startup so snapshot() is useful from the first request. */
async function warm() {
  await load();
  return cache;
}

/* ------------------------------- Updating -------------------------------- */

const SECTIONS = ['general', 'seo', 'branding', 'commerce', 'social'];

// Mongoose Map keys cannot contain a dot, so stamps are stored as
// "general__siteName" and translated back to "general.siteName" on the way out.
const stampKey = (path) => path.split('.').join('__');

/** fieldUpdatedAt as a plain object keyed by the dotted paths the panel uses. */
function stampsOf(doc) {
  const raw = doc instanceof Map ? doc : new Map(Object.entries(doc || {}));
  const out = {};
  raw.forEach((value, key) => {
    out[key.split('__').join('.')] = value;
  });
  return out;
}

/**
 * Merges an admin patch into a document section by section, stamping
 * fieldUpdatedAt for every value that actually changed so the panel can show
 * when each field was last set.
 */
function applyPatch(doc, patch = {}, now = new Date()) {
  SECTIONS.forEach((section) => {
    const incoming = patch[section];
    if (!incoming || typeof incoming !== 'object') return;

    Object.keys(incoming).forEach((field) => {
      if (incoming[field] === undefined) return;
      const path = section + '.' + field;
      const before = JSON.stringify(doc.get(path) ?? null);
      doc.set(path, incoming[field]);
      if (JSON.stringify(doc.get(path) ?? null) !== before) doc.fieldUpdatedAt.set(stampKey(path), now);
    });
  });

  return doc;
}

async function update(patch = {}) {
  let doc = await Settings.findOne({ key: 'default' });
  if (!doc) doc = await Settings.create({ key: 'default' });

  applyPatch(doc, patch);
  await doc.save();

  cache = plain(doc);
  return cache;
}

/* -------------------------------- Shaping -------------------------------- */

/** The full document for the admin panel, with dotted "last updated" stamps. */
function adminShape(s = snapshot()) {
  return { ...s, fieldUpdatedAt: stampsOf(s.fieldUpdatedAt) };
}

/** Everything the public storefront is allowed to see. */
function publicShape(s = snapshot()) {
  const whatsapp = s.general.whatsappNumber || '';

  return {
    brandName: s.general.siteName,
    tagline: s.general.tagline,
    supportEmail: s.general.contactEmail,
    supportPhone: s.general.contactNumber,
    supportWhatsapp: whatsapp,
    whatsappLink: whatsapp ? 'https://wa.me/' + whatsapp.replace(/[^\d]/g, '') : '',
    supportHours: s.general.supportHours,
    address: s.general.companyAddress,
    city: s.general.city,
    serviceAreas: s.general.serviceAreas || [],
    googleMapsEmbed: s.general.googleMapsEmbed,
    seo: s.seo,
    branding: s.branding,
    minOrderValue: s.commerce.minOrderValue,
    deliveryFee: s.commerce.deliveryFee,
    freeDeliveryAbove: s.commerce.freeDeliveryAbove,
    taxPercent: s.commerce.taxPercent,
    socials: s.social,
  };
}

module.exports = { get, snapshot, warm, update, publicShape, adminShape };
