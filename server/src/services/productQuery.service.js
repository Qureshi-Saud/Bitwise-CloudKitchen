'use strict';
const Category = require('../models/Category');

const PRICE_BANDS = {
  '100-150': { $gte: 100, $lte: 150 },
  '150-200': { $gt: 150, $lte: 200 },
  '200+': { $gt: 200 },
};

/**
 * Diet tag filters used by the Menu and Nutrition pages. Each maps to a real
 * Mongo condition so the UI filters are genuinely backend driven.
 */
const TAG_FILTERS = {
  'high-protein': { 'nutrition.protein': { $gte: 15 } },
  'high-fibre': { 'nutrition.fibre': { $gte: 5 } },
  'under-300-kcal': { 'nutrition.calories': { $lte: 300 } },
  'less-oil': { dietTags: 'less-oil' },
  'oats-based': { dietTags: 'oats-based' },
  'quinoa-based': { dietTags: 'quinoa-based' },
  'fruit-based': { dietTags: 'fruit-based' },
  'whole-grain': { dietTags: 'whole-grain' },
  'millet-based': { dietTags: 'millet-based' },
  'low-fat': { 'nutrition.fat': { $lte: 8 } },
};

const SORTS = {
  popular: { isPopular: -1, soldCount: -1, createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, reviewCount: -1 },
  newest: { createdAt: -1 },
  'protein-desc': { 'nutrition.protein': -1 },
  'calories-asc': { 'nutrition.calories': 1 },
  name: { name: 1 },
};

/** Translates validated query params into a Mongo filter + sort. */
async function buildProductFilter(query = {}, { adminView = false } = {}) {
  const filter = {};
  const and = [];

  if (!adminView) filter.isAvailable = true;
  else if (query.available) filter.isAvailable = query.available === 'true';

  if (query.search) {
    // Strip regex metacharacters instead of escaping them: safer and index friendly.
    const safe = String(query.search).replace(/[^a-zA-Z0-9 &-]/g, ' ').trim();
    const rx = new RegExp(safe, 'i');
    and.push({ $or: [{ name: rx }, { shortDescription: rx }, { description: rx }, { ingredients: rx }, { badges: rx }, { dietTags: rx }] });
  }

  const categorySlugs = [];
  if (query.category) categorySlugs.push(query.category);
  if (query.categories?.length) categorySlugs.push(...query.categories);
  if (categorySlugs.length) {
    const ids = categorySlugs.filter((c) => /^[0-9a-fA-F]{24}$/.test(c));
    const slugs = categorySlugs.filter((c) => !/^[0-9a-fA-F]{24}$/.test(c));
    const found = slugs.length ? await Category.find({ slug: { $in: slugs } }).select('_id').lean() : [];
    filter.category = { $in: [...ids, ...found.map((c) => c._id)] };
  }

  if (query.foodType && query.foodType !== 'all') filter.foodType = query.foodType;
  if (query.popular) filter.isPopular = query.popular === 'true';

  for (const tag of query.tags || []) {
    const condition = TAG_FILTERS[String(tag).toLowerCase()];
    if (condition) and.push(condition);
  }

  const price = {};
  if (query.priceBand && PRICE_BANDS[query.priceBand]) Object.assign(price, PRICE_BANDS[query.priceBand]);
  if (query.minPrice !== undefined) price.$gte = query.minPrice;
  if (query.maxPrice !== undefined) price.$lte = query.maxPrice;
  if (Object.keys(price).length) filter.price = price;

  if (query.maxCalories !== undefined) and.push({ 'nutrition.calories': { $lte: query.maxCalories } });
  if (query.minProtein !== undefined) and.push({ 'nutrition.protein': { $gte: query.minProtein } });
  if (query.minFibre !== undefined) and.push({ 'nutrition.fibre': { $gte: query.minFibre } });

  if (and.length) filter.$and = and;

  return { filter, sort: SORTS[query.sort] || SORTS.popular };
}

module.exports = { buildProductFilter, TAG_FILTERS };
