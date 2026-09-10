'use strict';
const SnackBoxConfig = require('../models/SnackBoxConfig');
const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/ApiResponse');
const { buildSnackBoxLine } = require('../services/pricing.service');

const getConfig = async () =>
  (await SnackBoxConfig.findOne({ key: 'default' })) || SnackBoxConfig.create({ key: 'default' });

/**
 * GET /snack-box/config
 * Everything the "Build Your Own Snack Box" page needs. This is a ONE-TIME box:
 * there are no plans, cycles or renewals in this payload by design.
 */
exports.config = asyncHandler(async (_req, res) => {
  const [config, categories, products] = await Promise.all([
    getConfig(),
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    Product.find({ isAvailable: true, snackBoxEligible: true })
      .select('name slug price images foodType nutrition badges category shortDescription')
      .populate('category', 'name slug')
      .sort({ isPopular: -1, name: 1 })
      .lean(),
  ]);

  const grouped = categories.map((c) => ({
    ...c,
    products: products.filter((p) => String(p.category?._id) === String(c._id)),
  })).filter((c) => c.products.length);

  return ok(res, {
    message: 'Snack box configuration',
    data: {
      title: config.title,
      subtitle: config.subtitle,
      isOneTime: true,
      isSubscription: false,
      notice: 'This is a one-time snack box. No plans, no auto-renewal, no commitment.',
      minItems: config.minItems,
      maxItems: config.maxItems,
      packagingFee: config.packagingFee,
      sizeTiers: config.sizeTiers,
      extras: (config.extras || []).filter((e) => e.isAvailable),
      categories: grouped,
    },
  });
});

/** POST /snack-box/quote - live box summary before adding it to the cart. */
exports.quote = asyncHandler(async (req, res) => {
  const line = await buildSnackBoxLine({
    boxItems: req.body.boxItems,
    extras: req.body.extras,
    quantity: req.body.quantity || 1,
  });

  const config = await getConfig();
  const itemCount = line.boxItems.reduce((s, i) => s + i.quantity, 0);

  return ok(res, {
    message: 'Snack box summary',
    data: {
      isOneTime: true,
      itemCount,
      items: line.boxItems,
      extras: line.boxExtras,
      itemsSubtotal: line.basePrice,
      savings: Math.max(Math.round((line.basePrice * config.discountForCount(itemCount)) / 100), 0),
      packagingFee: config.packagingFee,
      boxPrice: line.unitPrice,
      quantity: line.quantity,
      total: line.lineTotal,
      nutrition: line.nutritionSnapshot,
      foodType: line.foodType,
    },
  });
});

/* ------------------------------ Admin actions ----------------------------- */

exports.updateConfig = asyncHandler(async (req, res) => {
  const config = await SnackBoxConfig.findOneAndUpdate({ key: 'default' }, req.body, {
    new: true, upsert: true, runValidators: true,
  });
  return ok(res, { message: 'Snack box configuration updated', data: config });
});

exports.adminConfig = asyncHandler(async (_req, res) => {
  const config = await getConfig();
  return ok(res, { message: 'Snack box configuration', data: config });
});
