'use strict';
const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const { destroy } = require('../config/cloudinary');

/** GET /categories - includes live product counts for the Menu page. */
exports.list = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === 'admin';
  const filter = includeInactive ? {} : { isActive: true };

  const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean();
  const counts = await Product.aggregate([
    { $match: { isAvailable: true } },
    { $group: { _id: '$category', count: { $sum: 1 }, minPrice: { $min: '$price' } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c]));

  const data = categories.map((c) => ({
    ...c,
    productCount: countMap.get(String(c._id))?.count || 0,
    startingPrice: countMap.get(String(c._id))?.minPrice || null,
  }));

  return ok(res, { message: 'Categories fetched', data });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).lean();
  if (!category) throw ApiError.notFound('Category not found');
  return ok(res, { message: 'Category', data: category });
});

exports.create = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  return created(res, { message: 'Category created', data: category });
});

exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw ApiError.notFound('Category not found');
  return ok(res, { message: 'Category updated', data: category });
});

exports.remove = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse) throw ApiError.badRequest('Move or delete the ' + inUse + ' products in this category first');

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  await destroy(category.image?.publicId);

  return ok(res, { message: 'Category deleted' });
});
