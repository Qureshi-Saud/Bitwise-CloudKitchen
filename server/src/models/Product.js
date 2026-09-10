'use strict';
const mongoose = require('mongoose');
const slugify = require('slugify');

const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
    fibre: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    sodium: { type: Number, default: 0, min: 0 },
    iron: { type: Number, default: 0, min: 0 },
    calcium: { type: Number, default: 0, min: 0 },
    potassium: { type: Number, default: 0, min: 0 },
    vitaminA: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

/** A single selectable choice inside a customization group. */
const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    priceDelta: { type: Number, default: 0 },
    nutritionDelta: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fibre: { type: Number, default: 0 },
    },
    isDefault: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    tags: [{ type: String, trim: true }],
  },
  { _id: true }
);

/**
 * Customization groups are fully database driven: the Customize page renders
 * whatever the admin configures, and price/nutrition are recomputed server-side.
 */
const optionGroupSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    helpText: { type: String, trim: true, maxlength: 160 },
    type: { type: String, enum: ['single', 'multiple'], default: 'single' },
    required: { type: Boolean, default: false },
    minSelect: { type: Number, default: 0, min: 0 },
    maxSelect: { type: Number, default: 1, min: 1 },
    order: { type: Number, default: 0 },
    options: { type: [optionSchema], default: [] },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 90 },
    slug: { type: String, unique: true, index: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 1200 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    price: { type: Number, required: [true, 'Price is required'], min: [1, 'Price must be positive'] },
    compareAtPrice: { type: Number, min: 0 },

    images: {
      type: [{ url: { type: String, required: true }, publicId: String, alt: String }],
      default: [],
    },

    foodType: { type: String, enum: ['veg', 'non-veg'], default: 'veg', index: true },
    nutrition: { type: nutritionSchema, default: () => ({}) },
    servingSize: { type: String, default: '1 portion', maxlength: 40 },
    prepTimeMinutes: { type: Number, default: 15, min: 1 },

    ingredients: [{ type: String, trim: true, maxlength: 60 }],
    allergens: [{ type: String, trim: true, maxlength: 40 }],
    badges: [{ type: String, uppercase: true, trim: true, maxlength: 30 }],
    dietTags: [{ type: String, lowercase: true, trim: true, maxlength: 30 }],

    optionGroups: { type: [optionGroupSchema], default: [] },
    isCustomizable: { type: Boolean, default: false },
    snackBoxEligible: { type: Boolean, default: true, index: true },

    isAvailable: { type: Boolean, default: true, index: true },
    isPopular: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    stockStatus: { type: String, enum: ['in-stock', 'limited', 'out-of-stock'], default: 'in-stock' },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ name: 'text', shortDescription: 'text', ingredients: 'text', badges: 'text', dietTags: 'text' });
productSchema.index({ category: 1, isAvailable: 1, price: 1 });
productSchema.index({ 'nutrition.calories': 1 });
productSchema.index({ 'nutrition.protein': -1 });
productSchema.index({ isPopular: -1, soldCount: -1 });

productSchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

productSchema.pre('save', function syncCustomizable(next) {
  this.isCustomizable = Array.isArray(this.optionGroups) && this.optionGroups.length > 0;
  next();
});

productSchema.virtual('thumbnail').get(function thumbnail() {
  return this.images?.[0]?.url || null;
});

productSchema.virtual('isVeg').get(function isVeg() {
  return this.foodType === 'veg';
});

module.exports = mongoose.model('Product', productSchema);
