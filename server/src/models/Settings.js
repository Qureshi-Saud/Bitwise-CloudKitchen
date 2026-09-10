'use strict';
const mongoose = require('mongoose');

/**
 * Single source of truth for everything about the business itself: identity,
 * contact details, commerce rules, branding, SEO and social profiles.
 *
 * This is a singleton document (key: 'default'). Nothing here belongs in .env
 * any more — the admin panel owns these values and the storefront reads them
 * back over the API. Identity, contact, branding, SEO and social fields default
 * to empty on purpose: no brand is hardcoded anywhere, so a fresh database
 * starts blank and the admin fills it in. Only the commerce numbers carry a
 * starting value, because the cart needs valid arithmetic from the first request.
 */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true, index: true },

    general: {
      siteName: { type: String, trim: true, maxlength: 80, default: '' },
      tagline: { type: String, trim: true, maxlength: 120, default: '' },
      contactEmail: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
      contactNumber: { type: String, trim: true, maxlength: 20, default: '' },
      whatsappNumber: { type: String, trim: true, maxlength: 20, default: '' },
      companyAddress: { type: String, trim: true, maxlength: 300, default: '' },
      city: { type: String, trim: true, maxlength: 120, default: '' },
      serviceAreas: { type: [String], default: [] },
      supportHours: { type: String, trim: true, maxlength: 120, default: '' },
      googleMapsEmbed: { type: String, trim: true, maxlength: 1000, default: '' },
    },

    seo: {
      metaTitle: { type: String, trim: true, maxlength: 70, default: '' },
      metaDescription: { type: String, trim: true, maxlength: 200, default: '' },
      metaKeywords: { type: String, trim: true, maxlength: 400, default: '' },
    },

    branding: {
      logoUrl: { type: String, trim: true, maxlength: 500, default: '' },
      faviconUrl: { type: String, trim: true, maxlength: 500, default: '' },
    },

    /** Money rules the storefront, cart and order pipeline all obey. */
    commerce: {
      minOrderValue: { type: Number, min: 0, default: 100 },
      deliveryFee: { type: Number, min: 0, default: 29 },
      freeDeliveryAbove: { type: Number, min: 0, default: 399 },
      taxPercent: { type: Number, min: 0, max: 100, default: 5 },
    },

    social: {
      instagram: { type: String, trim: true, maxlength: 300, default: '' },
      facebook: { type: String, trim: true, maxlength: 300, default: '' },
      twitter: { type: String, trim: true, maxlength: 300, default: '' },
      linkedin: { type: String, trim: true, maxlength: 300, default: '' },
      youtube: { type: String, trim: true, maxlength: 300, default: '' },
    },

    /**
     * Dotted field path -> when an admin last changed it. Drives the
     * "Never updated" / "Updated 3 days ago" hints in the admin panel.
     */
    fieldUpdatedAt: { type: Map, of: Date, default: () => ({}) },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('Settings', settingsSchema);
