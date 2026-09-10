'use strict';
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const settingsService = require('./settings.service');

const NUTRITION_DISCLAIMER =
  'Nutrition values are approximate and may vary according to ingredients, preparation method and portion size.';

const MEDICAL_REFERRAL =
  'I can share the ingredients and approximate nutrition for every snack, but I am not able to give medical or ' +
  'therapeutic dietary advice. For allergies or any medical condition, please consult a qualified doctor or a ' +
  'registered dietitian before making changes to your diet.';

/** Keyword-driven intent detection over the live catalogue. */
const INTENTS = [
  { name: 'greeting', patterns: [/^(hi|hey|hello|salaam|namaste|good (morning|evening|afternoon))\b/i] },
  { name: 'medical', patterns: [/\b(allerg\w*|diabet\w*|thyroid|bp|blood pressure|cholesterol|pcod|pcos|disease|cure|treat|medicine|pregnan\w*|gluten intoleran\w*|lactose intoleran\w*)\b/i] },
  { name: 'subscription', patterns: [/\b(tiffin|subscription|subscribe|monthly plan|weekly plan|daily plan|meal plan)\b/i] },
  { name: 'order_status', patterns: [/\b(track|order status|where is my order|my order|delivery status)\b/i] },
  { name: 'delivery', patterns: [/\b(deliver\w*|shipping|how long|delivery time|delivery charge|service area|areas)\b/i] },
  { name: 'payment', patterns: [/\b(payment|pay|upi|razorpay|cod|cash on delivery|refund)\b/i] },
  { name: 'customize', patterns: [/\b(customi[sz]\w*|add extra|without|replace|swap|topping)\b/i] },
  { name: 'snackbox', patterns: [/\b(snack box|box|combo|bundle)\b/i] },
  { name: 'price', patterns: [/\b(price|cost|how much|cheap|budget|under \d+|starting)\b/i] },
  { name: 'nutrition', patterns: [/\b(calorie|kcal|protein|carb|fat|fibre|fiber|nutrition|macro|iron|calcium|potassium|vitamin)\b/i] },
  { name: 'menu', patterns: [/\b(menu|categor\w*|what do you have|options|items|recommend|suggest|hungry|craving)\b/i] },
  { name: 'hygiene', patterns: [/\b(hygien\w*|clean|fresh|safe|fssai|kitchen)\b/i] },
  { name: 'contact', patterns: [/\b(contact|phone|whatsapp|email|support|talk to|call)\b/i] },
];

function detectIntent(text) {
  for (const intent of INTENTS) {
    if (intent.patterns.some((p) => p.test(text))) return intent.name;
  }
  return 'menu';
}

/** Turns free text into a real catalogue query so answers are always grounded. */
async function findProducts(text, limit = 4) {
  const t = text.toLowerCase();
  const filter = { isAvailable: true };
  const and = [];

  if (/\bhigh protein|protein\b/.test(t)) and.push({ 'nutrition.protein': { $gte: 15 } });
  if (/\bhigh fib(re|er)|fibre|fiber\b/.test(t)) and.push({ 'nutrition.fibre': { $gte: 5 } });
  if (/\blow cal|under 300|light\b/.test(t)) and.push({ 'nutrition.calories': { $lte: 300 } });
  if (/\bveg\b/.test(t) && !/non.?veg/.test(t)) filter.foodType = 'veg';
  if (/non.?veg|chicken/.test(t)) filter.foodType = 'non-veg';

  const priceMatch = t.match(/under (?:rs\.?\s*)?(\d{2,4})/);
  if (priceMatch) filter.price = { $lte: Number(priceMatch[1]) };

  const keyword = String(text).replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const words = keyword.split(/\s+/).filter((w) => w.length > 3).slice(0, 4);
  if (words.length) {
    const rx = new RegExp(words.join('|'), 'i');
    and.push({ $or: [{ name: rx }, { ingredients: rx }, { dietTags: rx }, { badges: rx }, { shortDescription: rx }] });
  }
  if (and.length) filter.$and = and;

  let products = await Product.find(filter)
    .select('name slug price images foodType nutrition badges shortDescription')
    .sort({ isPopular: -1, rating: -1 })
    .limit(limit)
    .lean();

  // Fall back to popular snacks rather than answering with nothing.
  if (!products.length) {
    products = await Product.find({ isAvailable: true })
      .select('name slug price images foodType nutrition badges shortDescription')
      .sort({ isPopular: -1, soldCount: -1 })
      .limit(limit)
      .lean();
  }
  return products;
}

const money = (n) => 'Rs. ' + n;
const listProducts = (products) =>
  products.map((p) => '- ' + p.name + ' (' + money(p.price) + ', ' + Math.round(p.nutrition?.calories || 0) +
    ' kcal, ' + Math.round(p.nutrition?.protein || 0) + 'g protein)').join('\n');

/** Builds Snack Buddy's grounded reply. */
async function respond(text, user) {
  const intent = detectIntent(text);
  const settings = await settingsService.get();
  const areas = settings.general.serviceAreas || [];
  const serviceAreaLine = areas.length
    ? [areas.slice(0, -1).join(", "), areas[areas.length - 1]].filter(Boolean).join(areas.length > 1 ? " and " : "")
    : settings.general.city;
  const quickReplies = ['Show high protein snacks', 'Snacks under Rs. 150', 'What is in a snack box?', 'Track my order'];

  if (intent === 'medical') {
    return {
      intent,
      reply: MEDICAL_REFERRAL + '\n\nEvery product page lists its full ingredient list and allergen information, ' +
        'so you can check exactly what goes into each snack.',
      products: [],
      quickReplies: ['Show ingredient details', 'Show veg only snacks'],
    };
  }

  if (intent === 'subscription') {
    return {
      intent,
      reply: 'We do not run tiffin services, meal plans or subscriptions of any kind. ' +
        'Everything here is on-demand: order individual snacks whenever you like, starting from Rs. 100. ' +
        'You can also build a one-time Snack Box - it is a single order, never a recurring plan.',
      products: await findProducts('popular', 3),
      quickReplies: ['Build a snack box', 'Show the menu'],
    };
  }

  if (intent === 'greeting') {
    return {
      intent,
      reply: 'Hi' + (user?.name ? ' ' + user.name.split(' ')[0] : '') +
        '! I am Snack Buddy from ' + settings.general.siteName + '. ' +
        'Ask me about our menu, ingredients, nutrition, prices, customization, delivery or your order status.',
      products: [],
      quickReplies,
    };
  }

  if (intent === 'order_status') {
    if (!user) {
      return {
        intent,
        reply: 'Sign in and I can pull up your latest order, or head to the Track Order page and enter your order number.',
        products: [],
        quickReplies: ['Show the menu'],
      };
    }
    const order = await Order.findOne({ user: user._id }).sort({ createdAt: -1 }).lean();
    if (!order) {
      return { intent, reply: 'You have not placed an order yet. Shall I suggest a few popular snacks?', products: await findProducts('popular', 3), quickReplies };
    }
    return {
      intent,
      reply: 'Your latest order ' + order.orderNumber + ' is currently "' + order.status + '". ' +
        'Total ' + money(order.pricing.total) + '. You can watch live progress on the Track Order page.',
      products: [],
      link: '/track-order?order=' + order.orderNumber,
      quickReplies: ['Order again', 'Show the menu'],
    };
  }

  if (intent === 'delivery') {
    return {
      intent,
      reply: (serviceAreaLine ? 'We deliver across ' + serviceAreaLine + '. ' : '') +
        'Pick a delivery date and time slot at checkout. Delivery is ' + money(settings.commerce.deliveryFee) +
        ', and free on orders above ' + money(settings.commerce.freeDeliveryAbove) + '. Most snacks are prepared fresh in 15-25 minutes.',
      products: [],
      quickReplies,
    };
  }

  if (intent === 'payment') {
    return {
      intent,
      reply: 'You can pay by UPI, card, netbanking or wallet through Razorpay, or choose Cash on Delivery. ' +
        'Minimum order value is ' + money(settings.commerce.minOrderValue) + '. Refunds for prepaid orders reach your account in 3-5 working days.',
      products: [],
      quickReplies,
    };
  }

  if (intent === 'customize') {
    return {
      intent,
      reply: 'Almost everything is customizable. Salads let you pick base, protein, veggies, seeds and dressing. ' +
        'Wraps let you choose the wrap type, filling, veggies and sauces. Smoothies let you pick milk or yogurt, ' +
        'chia or flax, peanut butter, extra fruit and oats. Oats jars let you add fruits, nuts, seeds, cocoa or peanut butter. ' +
        'The price and approximate nutrition update instantly as you choose.\n\n' + NUTRITION_DISCLAIMER,
      products: await findProducts(text, 3),
      link: '/customize',
      quickReplies: ['Customize a salad', 'Customize a wrap'],
    };
  }

  if (intent === 'snackbox') {
    return {
      intent,
      reply: 'Build Your Own Snack Box lets you mix salad bowls, wraps, sandwiches, cutlets, smoothies and oats jars ' +
        'into a single one-time box, with optional extras like extra paneer, seeds, nuts, fruit, hummus, yogurt dip or chia seeds. ' +
        'The total updates live and you see the full summary before adding it to the cart. It is a one-time box, not a subscription.',
      products: [],
      link: '/snack-box',
      quickReplies: ['Build a snack box', 'Show the menu'],
    };
  }

  if (intent === 'hygiene') {
    return {
      intent,
      reply: 'Every snack is prepared fresh to order in our cloud kitchen. We use clean, dated ingredients, ' +
        'sanitised prep stations, gloves and hairnets, and tamper-evident packaging. Nothing is pre-fried or reheated from stock.',
      products: [],
      quickReplies,
    };
  }

  if (intent === 'contact') {
    return {
      intent,
      reply: 'You can reach us on ' + settings.general.contactNumber + ', WhatsApp us at ' + settings.general.whatsappNumber +
        ', or email ' + settings.general.contactEmail + '. Support hours are ' + settings.general.supportHours + '.',
      products: [],
      link: '/contact',
      quickReplies,
    };
  }

  const products = await findProducts(text, 4);

  if (intent === 'nutrition') {
    return {
      intent,
      reply: 'Here is what I found, with approximate values per serving:\n\n' + listProducts(products) +
        '\n\n' + NUTRITION_DISCLAIMER,
      products,
      link: '/nutrition',
      quickReplies: ['Compare nutrition', 'Show high fibre snacks'],
    };
  }

  if (intent === 'price') {
    const cheapest = [...products].sort((a, b) => a.price - b.price);
    return {
      intent,
      reply: 'Our snacks start at ' + money(100) + '. Based on what you asked:\n\n' + listProducts(cheapest),
      products: cheapest,
      link: '/menu',
      quickReplies: ['Snacks under Rs. 150', 'Show the full menu'],
    };
  }

  const categories = await Category.find({ isActive: true }).select('name').sort({ order: 1 }).lean();
  return {
    intent: 'menu',
    reply: 'We serve ' + categories.map((c) => c.name).join(', ') + '. Here are a few you might like:\n\n' +
      listProducts(products) + '\n\n' + NUTRITION_DISCLAIMER,
    products,
    link: '/menu',
    quickReplies,
  };
}

module.exports = { respond, NUTRITION_DISCLAIMER };
