'use strict';
const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    slug: { type: String, unique: true, index: true },
    tagline: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 400 },
    image: { url: String, publicId: String },
    icon: { type: String, default: 'Salad' },
    accent: { type: String, default: '#16a34a' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

categorySchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

/**
 * Query-based writes (seed upserts, admin PUT /categories/:id) skip document
 * middleware, so the slug is derived here as well. Without this a renamed or
 * upserted category keeps a stale - or missing - slug and silently drops out of
 * the /menu category filter.
 */
categorySchema.pre('findOneAndUpdate', function setSlugOnUpdate(next) {
  const update = this.getUpdate() || {};
  const name = update.name || update.$set?.name;
  if (name) this.set('slug', slugify(name, { lower: true, strict: true }));
  next();
});

categorySchema.index({ order: 1, name: 1 });

module.exports = mongoose.model('Category', categorySchema);
