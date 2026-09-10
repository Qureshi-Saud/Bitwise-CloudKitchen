'use strict';

/**
 * The empty business profile a brand new database starts from.
 *
 * Deliberately blank: no store name, contact details, address, service areas,
 * SEO text, logo, favicon or social links are hardcoded anywhere in this
 * codebase. The admin fills these in under Admin Panel -> Organization and the
 * storefront, admin chrome and transactional emails all read them back from
 * there. The seeder never overwrites an existing record.
 *
 * Only the commerce numbers carry a starting value, because the cart and order
 * pipeline need something arithmetically valid before the admin has visited the
 * panel. They are editable in the same place.
 */
module.exports = {
  key: 'default',

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

  seo: {
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  },

  branding: {
    logoUrl: '',
    faviconUrl: '',
  },

  commerce: {
    minOrderValue: 100,
    deliveryFee: 29,
    freeDeliveryAbove: 399,
    taxPercent: 5,
  },

  social: {
    instagram: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    youtube: '',
  },
};
