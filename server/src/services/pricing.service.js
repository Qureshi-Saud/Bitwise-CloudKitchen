'use strict';
const Product = require('../models/Product');
const SnackBoxConfig = require('../models/SnackBoxConfig');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const settingsService = require('./settings.service');
const { addNutrition, scaleNutrition, emptyNutrition, round } = require('../utils/nutrition');

const NUTRITION_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fibre'];

const pickNutrition = (source = {}) =>
  NUTRITION_KEYS.reduce((acc, k) => ({ ...acc, [k]: round(Number(source[k] || 0)) }), {});

/**
 * Resolves the customer's selected option ids against the product's DB-defined
 * option groups. The client never decides the price - the server does.
 */
function resolveCustomizations(product, selections = []) {
  const groups = product.optionGroups || [];
  const resolved = [];
  let priceDelta = 0;
  let nutritionDelta = emptyNutrition();

  const byKey = new Map(selections.map((s) => [String(s.groupKey), s]));

  for (const group of groups) {
    const chosen = byKey.get(group.key);
    let optionIds = chosen ? [].concat(chosen.optionIds || chosen.optionId || []) : [];

    // A quick "Add to Cart" sends no options at all. Rather than rejecting it,
    // fall back to whatever the admin marked as the default for a required group -
    // that is exactly what isDefault is for. Only a required group with no default
    // genuinely needs the customer to make a choice.
    if (group.required && optionIds.length === 0) {
      const defaults = group.options.filter((o) => o.isDefault && o.isAvailable);
      if (!defaults.length) throw ApiError.badRequest('Please choose an option for ' + group.title);
      optionIds = (group.type === 'single' ? defaults.slice(0, 1) : defaults).map((o) => String(o._id));
    }

    if (optionIds.length === 0) continue;
    if (group.type === 'single' && optionIds.length > 1) {
      throw ApiError.badRequest('Only one option can be selected for ' + group.title);
    }
    if (group.type === 'multiple' && optionIds.length > group.maxSelect) {
      throw ApiError.badRequest('You can select at most ' + group.maxSelect + ' options for ' + group.title);
    }

    const picked = [];
    for (const id of optionIds) {
      const option = group.options.id(id);
      if (!option) throw ApiError.badRequest('Invalid option selected for ' + group.title);
      if (!option.isAvailable) throw ApiError.badRequest(option.label + ' is currently unavailable');
      priceDelta += option.priceDelta || 0;
      nutritionDelta = addNutrition(nutritionDelta, pickNutrition(option.nutritionDelta || {}));
      picked.push({ optionId: String(option._id), label: option.label, priceDelta: option.priceDelta || 0 });
    }

    resolved.push({ groupKey: group.key, groupTitle: group.title, selections: picked });
  }

  return { resolved, priceDelta: Math.round(priceDelta), nutritionDelta };
}

/** Builds one authoritative order line from a raw client cart line. */
async function buildProductLine(line) {
  const product = await Product.findById(line.productId).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('One of the snacks in your cart is no longer available');
  if (!product.isAvailable || product.stockStatus === 'out-of-stock') {
    throw ApiError.badRequest(product.name + ' is currently unavailable');
  }

  const { resolved, priceDelta, nutritionDelta } = resolveCustomizations(product, line.customizations || []);
  const quantity = Math.min(Math.max(Number(line.quantity) || 1, 1), 20);
  const basePrice = product.price;
  const unitPrice = basePrice + priceDelta;

  return {
    kind: 'product',
    product: product._id,
    name: product.name,
    slug: product.slug,
    image: product.images?.[0]?.url,
    categoryName: product.category?.name,
    foodType: product.foodType,
    basePrice,
    customizationPrice: priceDelta,
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    customizations: resolved,
    nutritionSnapshot: addNutrition(pickNutrition(product.nutrition), nutritionDelta),
    specialInstructions: line.specialInstructions,
  };
}

/** Builds a one-time snack box line. Explicitly NOT a subscription. */
async function buildSnackBoxLine(line) {
  const config =
    (await SnackBoxConfig.findOne({ key: 'default' })) || (await SnackBoxConfig.create({ key: 'default' }));

  const entries = (line.boxItems || []).filter((i) => Number(i.quantity) > 0);
  if (!entries.length) throw ApiError.badRequest('Your snack box is empty');

  const products = await Product.find({
    _id: { $in: entries.map((i) => i.productId) },
    isAvailable: true,
    snackBoxEligible: true,
  });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  let itemsSubtotal = 0;
  let count = 0;
  let nutrition = emptyNutrition();
  const boxItems = [];

  for (const entry of entries) {
    const product = productMap.get(String(entry.productId));
    if (!product) throw ApiError.badRequest('One of the snacks in your box is no longer available');
    const qty = Math.min(Math.max(Number(entry.quantity) || 1, 1), 10);
    itemsSubtotal += product.price * qty;
    count += qty;
    nutrition = addNutrition(nutrition, scaleNutrition(pickNutrition(product.nutrition), qty));
    boxItems.push({ product: product._id, name: product.name, quantity: qty, price: product.price });
  }

  if (count < config.minItems) throw ApiError.badRequest('A snack box needs at least ' + config.minItems + ' items');
  if (count > config.maxItems) throw ApiError.badRequest('A snack box can hold at most ' + config.maxItems + ' items');

  let extrasTotal = 0;
  const boxExtras = [];
  for (const key of line.extras || []) {
    const extra = (config.extras || []).find((e) => e.key === String(key).toLowerCase() && e.isAvailable);
    if (!extra) throw ApiError.badRequest('One of the selected extras is unavailable');
    extrasTotal += extra.price;
    nutrition = addNutrition(nutrition, pickNutrition(extra.nutritionDelta || {}));
    boxExtras.push({ label: extra.label, price: extra.price });
  }

  const discountPercent = config.discountForCount(count);
  const boxDiscount = Math.round((itemsSubtotal * discountPercent) / 100);
  const unitPrice = Math.max(itemsSubtotal - boxDiscount + extrasTotal + (config.packagingFee || 0), 0);
  const quantity = Math.min(Math.max(Number(line.quantity) || 1, 1), 10);
  const hasNonVeg = boxItems.some((b) => productMap.get(String(b.product))?.foodType === 'non-veg');

  return {
    kind: 'snackbox',
    name: 'Custom Snack Box (' + count + ' items)',
    image: productMap.get(String(boxItems[0].product))?.images?.[0]?.url,
    categoryName: 'Snack Box',
    foodType: hasNonVeg ? 'non-veg' : 'veg',
    basePrice: itemsSubtotal,
    customizationPrice: extrasTotal - boxDiscount + (config.packagingFee || 0),
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    customizations: boxExtras.length
      ? [
          {
            groupKey: 'extras',
            groupTitle: 'Box Extras',
            selections: boxExtras.map((e) => ({ label: e.label, priceDelta: e.price })),
          },
        ]
      : [],
    boxItems,
    boxExtras,
    nutritionSnapshot: nutrition,
    specialInstructions: line.specialInstructions,
  };
}

/** Rebuilds every cart line from the database and returns authoritative totals. */
async function buildCart(rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw ApiError.badRequest('Your cart is empty');
  if (rawItems.length > 30) throw ApiError.badRequest('Too many items in the cart');

  const items = [];
  for (const line of rawItems) {
    items.push(line.kind === 'snackbox' ? await buildSnackBoxLine(line) : await buildProductLine(line));
  }

  const itemsTotal = items.reduce((s, i) => s + i.basePrice * i.quantity, 0);
  const customizationTotal = items.reduce((s, i) => s + i.customizationPrice * i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const nutritionTotal = items.reduce(
    (acc, i) => addNutrition(acc, scaleNutrition(i.nutritionSnapshot || {}, i.quantity)),
    emptyNutrition()
  );

  return { items, itemsTotal, customizationTotal, subtotal, nutritionTotal };
}

/** Validates a coupon for a user + subtotal, returning the discount amount. */
async function applyCoupon(code, subtotal, user) {
  if (!code) return { discount: 0, coupon: null };

  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim(), isActive: true });
  if (!coupon) throw ApiError.badRequest('This coupon code is not valid');
  if (coupon.startsAt > new Date()) throw ApiError.badRequest('This coupon is not active yet');
  if (coupon.expiresAt < new Date()) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has been fully redeemed');
  }
  if (subtotal < coupon.minOrderValue) {
    throw ApiError.badRequest('Add items worth Rs. ' + (coupon.minOrderValue - subtotal) + ' more to use this coupon');
  }
  if (user) {
    if (coupon.firstOrderOnly && (user.stats?.totalOrders || 0) > 0) {
      throw ApiError.badRequest('This coupon is valid on your first order only');
    }
    const usage = coupon.usedBy.find((u) => String(u.user) === String(user._id));
    if (usage && usage.count >= coupon.perUserLimit) throw ApiError.badRequest('You have already used this coupon');
  }

  return { discount: coupon.computeDiscount(subtotal), coupon };
}

/** Final money maths. Delivery is free above the admin-configured threshold. */
async function computeTotals({ items, itemsTotal, customizationTotal, subtotal, discount = 0 }) {
  const { commerce } = await settingsService.get();
  const payable = Math.max(subtotal - discount, 0);
  const deliveryFee = payable >= commerce.freeDeliveryAbove ? 0 : commerce.deliveryFee;
  const tax = Math.round((payable * commerce.taxPercent) / 100);
  const total = Math.max(payable + deliveryFee + tax, 0);
  return { items, itemsTotal, customizationTotal, subtotal, discount, deliveryFee, tax, total };
}

module.exports = {
  buildCart,
  buildSnackBoxLine,
  applyCoupon,
  computeTotals,
  resolveCustomizations,
  pickNutrition,
};
