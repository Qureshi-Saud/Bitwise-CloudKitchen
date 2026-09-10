'use strict';
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { connectDB, disconnectDB } = require('../config/db');
const { User, Category, Product, Coupon, DeliverySlot, SnackBoxConfig, Settings } = require('../models');

const categoriesSeed = require('./categories');
const productsSeed = require('./products');
const settingsSeed = require('./settings');

const FRESH = process.argv.includes('--fresh');

// Bootstrap admin credentials. Kept here on purpose so a fresh clone can open
// the admin panel without any .env setup. Change the password after the first
// login - and change these values before deploying anywhere public.
const ADMIN = {
  name: 'Administrator',
  email: 'admin@bitewise.com',
  password: 'Admin@1234',
};

const slots = [
  { label: 'Breakfast (8:00 AM - 10:00 AM)', startTime: '08:00', endTime: '10:00', capacity: 40, cutoffMinutes: 60, order: 1 },
  { label: 'Mid-Morning (10:00 AM - 12:00 PM)', startTime: '10:00', endTime: '12:00', capacity: 50, cutoffMinutes: 45, order: 2 },
  { label: 'Lunch (12:00 PM - 3:00 PM)', startTime: '12:00', endTime: '15:00', capacity: 60, cutoffMinutes: 45, order: 3 },
  { label: 'Evening Snack (4:00 PM - 7:00 PM)', startTime: '16:00', endTime: '19:00', capacity: 60, cutoffMinutes: 45, order: 4 },
  { label: 'Dinner (7:00 PM - 9:30 PM)', startTime: '19:00', endTime: '21:30', capacity: 45, cutoffMinutes: 45, order: 5 },
];

const inDays = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const coupons = [
  { code: 'FRESH50', description: 'Flat Rs. 50 off on your very first snack order', discountType: 'flat', discountValue: 50, minOrderValue: 200, expiresAt: inDays(180), firstOrderOnly: true, perUserLimit: 1 },
  { code: 'HEALTHY10', description: '10% off, up to Rs. 60', discountType: 'percent', discountValue: 10, maxDiscount: 60, minOrderValue: 250, expiresAt: inDays(90), perUserLimit: 3 },
  { code: 'SNACKBOX15', description: '15% off on orders above Rs. 500 - perfect for a snack box', discountType: 'percent', discountValue: 15, maxDiscount: 120, minOrderValue: 500, expiresAt: inDays(60), perUserLimit: 2 },
  { code: 'STUDENT20', description: 'Rs. 20 off for students on orders above Rs. 150', discountType: 'flat', discountValue: 20, minOrderValue: 150, expiresAt: inDays(120), perUserLimit: 5 },
];

const snackBoxConfig = {
  key: 'default',
  title: 'Build Your Own Snack Box',
  subtitle: 'A one-time box, put together exactly the way you want it. No plans, no auto-renewal, no commitment.',
  minItems: 2,
  maxItems: 8,
  packagingFee: 0,
  sizeTiers: [
    { items: 2, label: 'Duo Box', discountPercent: 0 },
    { items: 3, label: 'Trio Box', discountPercent: 5 },
    { items: 4, label: 'Family Box (4+)', discountPercent: 8 },
    { items: 6, label: 'Party Box (6+)', discountPercent: 12 },
  ],
  extras: [
    { key: 'extra-paneer', label: 'Extra Paneer', price: 40, nutritionDelta: { calories: 130, protein: 11, carbs: 3, fat: 8, fibre: 0 } },
    { key: 'seeds', label: 'Mixed Seeds', price: 25, nutritionDelta: { calories: 70, protein: 3, carbs: 3, fat: 5, fibre: 3 } },
    { key: 'nuts', label: 'Roasted Nuts', price: 35, nutritionDelta: { calories: 90, protein: 3, carbs: 4, fat: 8, fibre: 2 } },
    { key: 'fruit', label: 'Seasonal Fruit Cup', price: 40, nutritionDelta: { calories: 70, protein: 1, carbs: 17, fat: 0, fibre: 3 } },
    { key: 'hummus', label: 'Hummus Dip', price: 30, nutritionDelta: { calories: 70, protein: 3, carbs: 6, fat: 4, fibre: 2 } },
    { key: 'yogurt-dip', label: 'Yogurt Dip', price: 25, nutritionDelta: { calories: 45, protein: 4, carbs: 3, fat: 2, fibre: 0 } },
    { key: 'chia-seeds', label: 'Chia Seeds', price: 20, nutritionDelta: { calories: 58, protein: 2, carbs: 5, fat: 4, fibre: 4 } },
  ],
  isActive: true,
};

async function run() {
  await connectDB();
  logger.info(FRESH ? 'Running a FRESH seed (existing catalogue will be replaced)' : 'Running an idempotent seed');

  if (FRESH) {
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Coupon.deleteMany({}),
      DeliverySlot.deleteMany({}),
      SnackBoxConfig.deleteMany({}),
    ]);
  }

  /* -------------------------------- Categories ------------------------------ */
  const categoryMap = new Map();
  for (const data of categoriesSeed) {
    const category = await Category.findOneAndUpdate({ name: data.name }, data, {
      upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true,
    });
    categoryMap.set(category.name, category._id);
  }
  logger.info('Categories ready: ' + categoryMap.size);

  /* --------------------------------- Products ------------------------------- */
  let productCount = 0;
  for (const data of productsSeed) {
    const categoryId = categoryMap.get(data.category);
    if (!categoryId) {
      logger.warn('Skipping ' + data.name + ' - unknown category ' + data.category);
      continue;
    }

    const payload = { ...data, category: categoryId };
    const existing = await Product.findOne({ name: data.name });

    if (existing) {
      existing.set(payload);
      await existing.save();
    } else {
      await Product.create(payload);
    }
    productCount += 1;
  }
  logger.info('Products ready: ' + productCount);

  /* ------------------------------ Delivery slots ---------------------------- */
  for (const slot of slots) {
    await DeliverySlot.findOneAndUpdate({ label: slot.label }, slot, {
      upsert: true, new: true, setDefaultsOnInsert: true,
    });
  }
  logger.info('Delivery slots ready: ' + slots.length);

  /* --------------------------------- Coupons -------------------------------- */
  for (const coupon of coupons) {
    await Coupon.findOneAndUpdate({ code: coupon.code }, coupon, {
      upsert: true, new: true, setDefaultsOnInsert: true,
    });
  }
  logger.info('Coupons ready: ' + coupons.length);

  /* ----------------------------- Snack box config --------------------------- */
  await SnackBoxConfig.findOneAndUpdate({ key: 'default' }, snackBoxConfig, {
    upsert: true, new: true, setDefaultsOnInsert: true,
  });
  logger.info('Snack box configuration ready (one-time box, no subscription)');

  /* ---------------------------- Business settings --------------------------- */
  // Seeded once. An admin editing Organization must never have their values
  // stomped by a later re-seed, so this only ever inserts.
  const existingSettings = await Settings.findOne({ key: 'default' });
  if (existingSettings) {
    logger.info('Business settings already exist - left untouched');
  } else {
    await Settings.create(settingsSeed);
    logger.info('Business settings created - edit them in Admin Panel -> Organization');
  }

  /* ------------------------------- Admin account ---------------------------- */
  // Bootstraps exactly ONE admin so the panel can be opened at all. The
  // credentials are the ADMIN constant at the top of this file. Additional
  // admins are made by signing up normally and then changing the role in
  // Admin Panel -> Customers.
  const adminEmail = ADMIN.email.toLowerCase();
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    admin = await User.create({
      name: ADMIN.name,
      email: adminEmail,
      password: ADMIN.password,
      role: 'admin',
      isEmailVerified: true,
    });
    logger.info('Admin account created: ' + admin.email);
  } else {
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save({ validateBeforeSave: false });
    }
    logger.info('Admin account already exists (password left untouched): ' + admin.email);
  }

  logger.info('Seed complete.');

  logger.info('============================================================');
  logger.info('  ADMIN LOGIN');
  logger.info('  Email    : ' + ADMIN.email);
  logger.info('  Password : ' + ADMIN.password);
  logger.info('  Change it after your first login.');
  logger.info('  Need more admins? Sign up as a normal user, then set the');
  logger.info('  role to admin in Admin Panel -> Customers.');
  logger.info('============================================================');

  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  logger.error('Seed failed: ' + err.message);
  logger.error(err.stack);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
