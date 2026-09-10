'use strict';
const { z } = require('zod');

const text = (max) => z.string().trim().max(max);
const optionalUrl = (max) =>
  z.union([z.literal(''), z.string().trim().url('Enter a full URL starting with https://').max(max)]);

const generalSection = z.object({
  siteName: text(80).min(2, 'Give the store a name'),
  tagline: text(120),
  contactEmail: z.union([z.literal(''), z.string().trim().email('Enter a valid email address').max(120)]),
  contactNumber: z.union([z.literal(''), z.string().trim().regex(/^[+\d][\d\s-]{7,19}$/, 'Enter a valid contact number')]),
  whatsappNumber: z.union([z.literal(''), z.string().trim().regex(/^[+\d][\d\s-]{7,19}$/, 'Enter a valid WhatsApp number')]),
  companyAddress: text(300),
  city: text(120),
  serviceAreas: z.array(text(60)).max(40),
  supportHours: text(120),
  googleMapsEmbed: text(1000),
}).partial();

const seoSection = z.object({
  metaTitle: text(70),
  metaDescription: text(200),
  metaKeywords: text(400),
}).partial();

const brandingSection = z.object({
  logoUrl: optionalUrl(500),
  faviconUrl: optionalUrl(500),
}).partial();

const commerceSection = z.object({
  minOrderValue: z.coerce.number().min(0).max(100000),
  deliveryFee: z.coerce.number().min(0).max(100000),
  freeDeliveryAbove: z.coerce.number().min(0).max(1000000),
  taxPercent: z.coerce.number().min(0).max(100),
}).partial();

const socialSection = z.object({
  instagram: optionalUrl(300),
  facebook: optionalUrl(300),
  twitter: optionalUrl(300),
  linkedin: optionalUrl(300),
  youtube: optionalUrl(300),
}).partial();

const settingsBody = z.object({
  general: generalSection,
  seo: seoSection,
  branding: brandingSection,
  commerce: commerceSection,
  social: socialSection,
}).partial();

module.exports = { settingsBody };
