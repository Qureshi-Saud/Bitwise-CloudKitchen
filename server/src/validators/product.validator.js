'use strict';
const { z } = require('zod');
const { objectId, nutritionDelta } = require('./common.validator');

const csv = (max = 20) =>
  z.union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : String(v).split(',')).map((s) => s.trim()).filter(Boolean).slice(0, max))
    .optional();

const optionSchema = z.object({
  _id: objectId.optional(),
  label: z.string().trim().min(1).max(60),
  priceDelta: z.coerce.number().min(-500).max(500).default(0),
  nutritionDelta: nutritionDelta.optional(),
  isDefault: z.coerce.boolean().default(false),
  isAvailable: z.coerce.boolean().default(true),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
});

const optionGroupSchema = z.object({
  _id: objectId.optional(),
  key: z.string().trim().toLowerCase().min(1).max(30),
  title: z.string().trim().min(1).max(80),
  helpText: z.string().trim().max(160).optional(),
  type: z.enum(['single', 'multiple']).default('single'),
  required: z.coerce.boolean().default(false),
  minSelect: z.coerce.number().int().min(0).default(0),
  maxSelect: z.coerce.number().int().min(1).default(1),
  order: z.coerce.number().int().default(0),
  options: z.array(optionSchema).max(30).default([]),
});

const nutritionFull = z.object({
  calories: z.coerce.number().min(0).default(0),
  protein: z.coerce.number().min(0).default(0),
  carbs: z.coerce.number().min(0).default(0),
  fat: z.coerce.number().min(0).default(0),
  fibre: z.coerce.number().min(0).default(0),
  sugar: z.coerce.number().min(0).optional(),
  sodium: z.coerce.number().min(0).optional(),
  iron: z.coerce.number().min(0).optional(),
  calcium: z.coerce.number().min(0).optional(),
  potassium: z.coerce.number().min(0).optional(),
  vitaminA: z.coerce.number().min(0).optional(),
}).partial();

const productBody = z.object({
  name: z.string().trim().min(2).max(90),
  shortDescription: z.string().trim().min(5).max(180),
  description: z.string().trim().max(1200).optional(),
  category: objectId,
  price: z.coerce.number().min(1).max(5000),
  compareAtPrice: z.coerce.number().min(0).max(5000).optional(),
  images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional(), alt: z.string().max(120).optional() })).max(6).optional(),
  foodType: z.enum(['veg', 'non-veg']).default('veg'),
  nutrition: nutritionFull.optional(),
  servingSize: z.string().trim().max(40).optional(),
  prepTimeMinutes: z.coerce.number().int().min(1).max(180).optional(),
  ingredients: z.array(z.string().trim().max(60)).max(40).optional(),
  allergens: z.array(z.string().trim().max(40)).max(20).optional(),
  badges: z.array(z.string().trim().max(30)).max(10).optional(),
  dietTags: z.array(z.string().trim().max(30)).max(15).optional(),
  optionGroups: z.array(optionGroupSchema).max(10).optional(),
  snackBoxEligible: z.coerce.boolean().optional(),
  isAvailable: z.coerce.boolean().optional(),
  isPopular: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  stockStatus: z.enum(['in-stock', 'limited', 'out-of-stock']).optional(),
  order: z.coerce.number().int().optional(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
  search: z.string().trim().max(80).optional(),
  category: z.string().trim().max(60).optional(),
  categories: csv(10),
  foodType: z.enum(['veg', 'non-veg', 'all']).optional(),
  tags: csv(12),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  priceBand: z.enum(['100-150', '150-200', '200+']).optional(),
  maxCalories: z.coerce.number().min(0).optional(),
  minProtein: z.coerce.number().min(0).optional(),
  minFibre: z.coerce.number().min(0).optional(),
  available: z.enum(['true', 'false']).optional(),
  popular: z.enum(['true', 'false']).optional(),
  sort: z.enum(['popular', 'price-asc', 'price-desc', 'rating', 'newest', 'protein-desc', 'calories-asc', 'name']).default('popular'),
});

module.exports = {
  create: { body: productBody },
  update: { body: productBody.partial(), params: z.object({ id: objectId }) },
  list: { query: listQuery },
  compare: { query: z.object({ ids: csv(6) }) },
  customizePreview: {
    params: z.object({ id: objectId }),
    body: z.object({
      customizations: z.array(z.object({
        groupKey: z.string().trim().max(30),
        optionIds: z.array(objectId).max(10).default([]),
      })).max(12).default([]),
      quantity: z.coerce.number().int().min(1).max(20).default(1),
    }),
  },
};
