'use strict';
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/ApiResponse');
const { TAG_FILTERS } = require('../services/productQuery.service');

const DISCLAIMER =
  'Nutrition values are approximate and may vary according to ingredients, preparation method and portion size.';

const MACROS = [
  {
    key: 'calories', label: 'Calories', unit: 'kcal',
    summary: 'The energy a snack gives you.',
    detail: 'Think of calories as fuel. A light snack sits around 200-300 kcal, while a filling one goes higher. Match it to how hungry you are and how active your day is.',
  },
  {
    key: 'protein', label: 'Protein', unit: 'g',
    summary: 'Helps you feel full for longer and supports muscle repair.',
    detail: 'Paneer, chicken, curd, sprouts, chickpeas and quinoa are our main protein sources. Anything with 15g or more carries the HIGH PROTEIN badge.',
  },
  {
    key: 'carbs', label: 'Carbohydrates', unit: 'g',
    summary: 'Your body preferred quick energy source.',
    detail: 'We lean on whole grains, oats, millets and fruit rather than refined flour, so energy is released more steadily.',
  },
  {
    key: 'fat', label: 'Fat', unit: 'g',
    summary: 'Needed in small amounts for absorption and taste.',
    detail: 'We cook with minimal oil and grill instead of deep-frying, using nuts, seeds and curd for better quality fats.',
  },
  {
    key: 'fibre', label: 'Fibre', unit: 'g',
    summary: 'Keeps digestion comfortable and hunger away for longer.',
    detail: 'Vegetables, oats, chia, flax, sprouts and whole grains do the heavy lifting. 5g or more earns the HIGH FIBRE badge.',
  },
];

const MICROS = [
  { key: 'iron', label: 'Iron', unit: 'mg', summary: 'Supports normal oxygen transport in the blood.', sources: 'Sprouts, spinach, brown chana, sesame seeds' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', summary: 'Contributes to normal bones and teeth.', sources: 'Paneer, curd, yogurt, sesame seeds, ragi' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', summary: 'Helps maintain normal fluid balance.', sources: 'Banana, potato, spinach, curd' },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg', summary: 'Supports normal vision and healthy skin.', sources: 'Carrot, spinach, mango, bell pepper' },
];

const BADGES = [
  { code: 'HIGH PROTEIN', rule: '15g protein or more per serving' },
  { code: 'HIGH FIBRE', rule: '5g fibre or more per serving' },
  { code: 'LESS OIL', rule: 'Grilled, steamed, baked or raw - never deep fried' },
  { code: 'WHOLE GRAIN', rule: 'Made with whole wheat, multigrain or brown rice' },
  { code: 'MILLET/OATS BASED', rule: 'Built on oats, ragi, jowar or bajra' },
  { code: 'UNDER 300 KCAL', rule: '300 kcal or less per serving' },
];

/** GET /nutrition/guide - plain-language explainers for the Nutrition page. */
exports.guide = asyncHandler(async (_req, res) =>
  ok(res, {
    message: 'Nutrition guide',
    data: {
      disclaimer: DISCLAIMER,
      macros: MACROS,
      micros: MICROS,
      badges: BADGES,
      filters: Object.keys(TAG_FILTERS),
      note: 'We share nutrition information for transparency only. We do not make medical, disease-treatment or therapeutic claims. For any medical condition or allergy, please consult a qualified doctor or registered dietitian.',
    },
  }));

/** GET /nutrition/products - lightweight nutrition table driven by real filters. */
exports.table = asyncHandler(async (req, res) => {
  const filter = { isAvailable: true };
  const and = [];

  if (req.query.foodType && req.query.foodType !== 'all') filter.foodType = req.query.foodType;
  if (req.query.maxCalories) and.push({ 'nutrition.calories': { $lte: Number(req.query.maxCalories) } });
  if (req.query.minProtein) and.push({ 'nutrition.protein': { $gte: Number(req.query.minProtein) } });
  if (req.query.minFibre) and.push({ 'nutrition.fibre': { $gte: Number(req.query.minFibre) } });

  for (const tag of String(req.query.tags || '').split(',').filter(Boolean)) {
    if (TAG_FILTERS[tag]) and.push(TAG_FILTERS[tag]);
  }
  if (and.length) filter.$and = and;

  const products = await Product.find(filter)
    .select('name slug price images foodType nutrition badges dietTags servingSize category')
    .populate('category', 'name slug')
    .sort({ 'nutrition.protein': -1 })
    .limit(60)
    .lean();

  return ok(res, {
    message: 'Nutrition table',
    data: products,
    meta: { disclaimer: DISCLAIMER, count: products.length },
  });
});

/** GET /nutrition/compare?ids=a,b,c - side by side comparison (max 4). */
exports.compare = asyncHandler(async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
    .slice(0, 4);

  const products = await Product.find({ _id: { $in: ids } })
    .select('name slug price images foodType nutrition badges servingSize ingredients allergens')
    .lean();

  return ok(res, { message: 'Nutrition comparison', data: products, meta: { disclaimer: DISCLAIMER } });
});
