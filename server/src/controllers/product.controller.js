'use strict';
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { buildProductFilter } = require('../services/productQuery.service');
const { resolveCustomizations, pickNutrition } = require('../services/pricing.service');
const { addNutrition } = require('../utils/nutrition');
const { destroy } = require('../config/cloudinary');

const PUBLIC_FIELDS =
  'name slug shortDescription description price compareAtPrice images foodType nutrition servingSize ' +
  'prepTimeMinutes ingredients allergens badges dietTags optionGroups isCustomizable snackBoxEligible ' +
  'isAvailable isPopular stockStatus rating reviewCount category createdAt';

/** GET /products - paginated, searchable, filterable catalogue. */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'staff';
  const { filter, sort } = await buildProductFilter(req.query, { adminView: isAdmin });

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select(isAdmin ? undefined : PUBLIC_FIELDS)
      .populate('category', 'name slug icon accent')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  return ok(res, { message: 'Products fetched', data: items, meta: buildMeta({ page, limit, total }) });
});

/** GET /products/popular */
exports.popular = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const items = await Product.find({ isAvailable: true, isPopular: true })
    .select(PUBLIC_FIELDS)
    .populate('category', 'name slug')
    .sort({ soldCount: -1, rating: -1 })
    .limit(limit)
    .lean({ virtuals: true });
  return ok(res, { message: 'Popular snacks', data: items });
});

/** GET /products/search-suggestions?q= */
exports.suggestions = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').replace(/[^a-zA-Z0-9 &-]/g, ' ').trim();
  if (q.length < 2) return ok(res, { message: 'Suggestions', data: [] });

  const rx = new RegExp(q, 'i');
  const items = await Product.find({
    isAvailable: true,
    $or: [{ name: rx }, { badges: rx }, { dietTags: rx }, { ingredients: rx }],
  })
    .select('name slug price images foodType nutrition.calories nutrition.protein')
    .limit(8)
    .lean();

  return ok(res, { message: 'Suggestions', data: items });
});

/** GET /products/:slug */
exports.getBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category', 'name slug icon accent')
    .lean({ virtuals: true });
  if (!product) throw ApiError.notFound('This snack could not be found');

  const [related, reviews] = await Promise.all([
    Product.find({ category: product.category?._id, _id: { $ne: product._id }, isAvailable: true })
      .select(PUBLIC_FIELDS)
      .limit(4)
      .lean({ virtuals: true }),
    Review.find({ product: product._id, status: 'published' })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ]);

  return ok(res, { message: 'Product details', data: { product, related, reviews } });
});

/** GET /products/compare?ids=a,b,c - nutrition comparison table. */
exports.compare = asyncHandler(async (req, res) => {
  const ids = (req.query.ids || []).filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
  if (!ids.length) throw ApiError.badRequest('Select at least one snack to compare');

  const items = await Product.find({ _id: { $in: ids }, isAvailable: true })
    .select('name slug price images foodType nutrition badges dietTags servingSize')
    .lean();

  return ok(res, { message: 'Comparison data', data: items });
});

/**
 * POST /products/:id/customize-preview
 * Server-authoritative live price + nutrition for the Customize page.
 */
exports.customizePreview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('This snack could not be found');

  const { resolved, priceDelta, nutritionDelta } = resolveCustomizations(product, req.body.customizations);
  const quantity = req.body.quantity || 1;
  const unitPrice = product.price + priceDelta;

  return ok(res, {
    message: 'Customization preview',
    data: {
      productId: product._id,
      name: product.name,
      basePrice: product.price,
      customizationPrice: priceDelta,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      nutrition: addNutrition(pickNutrition(product.nutrition), nutritionDelta),
      selections: resolved,
    },
  });
});

/* ------------------------------ Admin actions ----------------------------- */

exports.create = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) throw ApiError.badRequest('Select a valid category');

  const product = await Product.create(req.body);
  return created(res, { message: 'Product created', data: product });
});

exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  Object.assign(product, req.body);
  await product.save();

  return ok(res, { message: 'Product updated', data: product });
});

exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  await Promise.all((product.images || []).map((img) => destroy(img.publicId)));
  return ok(res, { message: 'Product deleted' });
});

exports.toggleAvailability = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  product.isAvailable = !product.isAvailable;
  product.stockStatus = product.isAvailable ? 'in-stock' : 'out-of-stock';
  await product.save();

  return ok(res, { message: product.isAvailable ? 'Product is now live' : 'Product hidden from the menu', data: product });
});

exports.adminGetById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  return ok(res, { message: 'Product', data: product });
});
