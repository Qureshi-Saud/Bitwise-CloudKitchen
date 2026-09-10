'use strict';

/**
 * Reusable customization templates. Each product references one of these, and
 * the Customize page renders whatever the database contains - nothing is
 * hardcoded on the frontend.
 */
const n = (calories = 0, protein = 0, carbs = 0, fat = 0, fibre = 0) => ({ calories, protein, carbs, fat, fibre });

const salad = [
  {
    key: 'base', title: 'Choose your base', type: 'single', required: true, order: 1,
    helpText: 'The foundation of your bowl',
    options: [
      { label: 'Mixed Sprouts', priceDelta: 0, isDefault: true, nutritionDelta: n(60, 5, 9, 1, 3) },
      { label: 'Quinoa', priceDelta: 30, nutritionDelta: n(120, 4, 21, 2, 3) },
      { label: 'Brown Chana', priceDelta: 20, nutritionDelta: n(110, 6, 18, 2, 5) },
      { label: 'Lettuce & Greens', priceDelta: 0, nutritionDelta: n(20, 1, 4, 0, 2) },
    ],
  },
  {
    key: 'protein', title: 'Add a protein', type: 'single', order: 2,
    options: [
      { label: 'No extra protein', priceDelta: 0, isDefault: true, nutritionDelta: n() },
      { label: 'Grilled Paneer', priceDelta: 40, nutritionDelta: n(130, 11, 3, 8, 0) },
      { label: 'Grilled Chicken', priceDelta: 50, nutritionDelta: n(110, 20, 0, 3, 0), tags: ['non-veg'] },
      { label: 'Boiled Egg', priceDelta: 25, nutritionDelta: n(78, 6, 1, 5, 0), tags: ['non-veg'] },
      { label: 'Roasted Chickpeas', priceDelta: 25, nutritionDelta: n(90, 5, 15, 2, 4) },
    ],
  },
  {
    key: 'vegetables', title: 'Pick your vegetables', type: 'multiple', maxSelect: 5, order: 3,
    helpText: 'Choose up to 5 - all free',
    options: [
      { label: 'Cucumber', priceDelta: 0, isDefault: true, nutritionDelta: n(8, 0, 2, 0, 1) },
      { label: 'Cherry Tomato', priceDelta: 0, isDefault: true, nutritionDelta: n(12, 1, 3, 0, 1) },
      { label: 'Bell Peppers', priceDelta: 0, nutritionDelta: n(15, 1, 3, 0, 1) },
      { label: 'Carrot', priceDelta: 0, nutritionDelta: n(18, 0, 4, 0, 1) },
      { label: 'Red Onion', priceDelta: 0, nutritionDelta: n(10, 0, 2, 0, 1) },
      { label: 'Sweet Corn', priceDelta: 15, nutritionDelta: n(45, 2, 9, 1, 2) },
      { label: 'Beetroot', priceDelta: 10, nutritionDelta: n(20, 1, 5, 0, 1) },
    ],
  },
  {
    key: 'seeds', title: 'Seeds & crunch', type: 'multiple', maxSelect: 3, order: 4,
    options: [
      { label: 'Chia Seeds', priceDelta: 20, nutritionDelta: n(58, 2, 5, 4, 4) },
      { label: 'Flax Seeds', priceDelta: 15, nutritionDelta: n(55, 2, 3, 4, 3) },
      { label: 'Pumpkin Seeds', priceDelta: 25, nutritionDelta: n(75, 4, 2, 6, 1) },
      { label: 'Roasted Peanuts', priceDelta: 15, nutritionDelta: n(80, 4, 3, 7, 1) },
    ],
  },
  {
    key: 'dressing', title: 'Dressing', type: 'single', required: true, order: 5,
    helpText: 'All dressings are made in-house with minimal oil',
    options: [
      { label: 'Lemon & Black Pepper', priceDelta: 0, isDefault: true, nutritionDelta: n(10, 0, 2, 0, 0) },
      { label: 'Mint Yogurt', priceDelta: 15, nutritionDelta: n(45, 3, 4, 2, 0) },
      { label: 'Olive Oil & Herb', priceDelta: 20, nutritionDelta: n(70, 0, 0, 8, 0) },
      { label: 'Roasted Sesame', priceDelta: 20, nutritionDelta: n(65, 2, 3, 5, 1) },
      { label: 'No dressing', priceDelta: 0, nutritionDelta: n() },
    ],
  },
];

const wrap = [
  {
    key: 'wrap-type', title: 'Wrap type', type: 'single', required: true, order: 1,
    options: [
      { label: 'Whole Wheat Roti', priceDelta: 0, isDefault: true, nutritionDelta: n(120, 4, 22, 2, 3) },
      { label: 'Multigrain Roti', priceDelta: 15, nutritionDelta: n(130, 5, 22, 3, 4) },
      { label: 'Ragi Roti', priceDelta: 20, nutritionDelta: n(125, 4, 24, 2, 4) },
      { label: 'Oats Roti', priceDelta: 20, nutritionDelta: n(135, 5, 23, 3, 4) },
    ],
  },
  {
    key: 'filling', title: 'Choose your filling', type: 'single', required: true, order: 2,
    options: [
      { label: 'Grilled Paneer', priceDelta: 0, isDefault: true, nutritionDelta: n(160, 13, 4, 10, 0) },
      { label: 'Grilled Chicken Tikka', priceDelta: 25, nutritionDelta: n(140, 22, 2, 5, 0), tags: ['non-veg'] },
      { label: 'Brown Chana & Hummus', priceDelta: 0, nutritionDelta: n(150, 8, 20, 5, 6) },
      { label: 'Rajma Masala', priceDelta: 10, nutritionDelta: n(140, 8, 22, 3, 7) },
      { label: 'Soya Chunks', priceDelta: 15, nutritionDelta: n(120, 16, 8, 2, 3) },
    ],
  },
  {
    key: 'vegetables', title: 'Vegetables inside', type: 'multiple', maxSelect: 5, order: 3,
    options: [
      { label: 'Onion', priceDelta: 0, isDefault: true, nutritionDelta: n(10, 0, 2, 0, 1) },
      { label: 'Tomato', priceDelta: 0, isDefault: true, nutritionDelta: n(12, 0, 3, 0, 1) },
      { label: 'Lettuce', priceDelta: 0, isDefault: true, nutritionDelta: n(8, 0, 1, 0, 1) },
      { label: 'Cucumber', priceDelta: 0, nutritionDelta: n(8, 0, 2, 0, 1) },
      { label: 'Bell Peppers', priceDelta: 10, nutritionDelta: n(15, 1, 3, 0, 1) },
      { label: 'Pickled Jalapeno', priceDelta: 15, nutritionDelta: n(6, 0, 1, 0, 1) },
    ],
  },
  {
    key: 'sauces', title: 'Sauces', type: 'multiple', maxSelect: 2, order: 4,
    helpText: 'Choose up to 2',
    options: [
      { label: 'Mint Chutney', priceDelta: 0, isDefault: true, nutritionDelta: n(15, 0, 3, 0, 1) },
      { label: 'Hung Curd Dip', priceDelta: 15, nutritionDelta: n(45, 4, 3, 2, 0) },
      { label: 'Hummus', priceDelta: 25, nutritionDelta: n(70, 3, 6, 4, 2) },
      { label: 'Schezwan (spicy)', priceDelta: 10, nutritionDelta: n(30, 0, 5, 1, 0) },
      { label: 'No sauce', priceDelta: 0, nutritionDelta: n() },
    ],
  },
];

const smoothie = [
  {
    key: 'liquid-base', title: 'Milk or yogurt base', type: 'single', required: true, order: 1,
    options: [
      { label: 'Toned Milk', priceDelta: 0, isDefault: true, nutritionDelta: n(90, 6, 9, 3, 0) },
      { label: 'Greek Yogurt', priceDelta: 25, nutritionDelta: n(100, 10, 6, 3, 0) },
      { label: 'Curd', priceDelta: 10, nutritionDelta: n(80, 5, 7, 4, 0) },
      { label: 'Almond Milk', priceDelta: 30, nutritionDelta: n(45, 2, 4, 3, 1) },
      { label: 'Coconut Water', priceDelta: 20, nutritionDelta: n(45, 0, 11, 0, 0) },
    ],
  },
  {
    key: 'boosters', title: 'Seeds & boosters', type: 'multiple', maxSelect: 4, order: 2,
    options: [
      { label: 'Chia Seeds', priceDelta: 20, nutritionDelta: n(58, 2, 5, 4, 4) },
      { label: 'Flax Seeds', priceDelta: 15, nutritionDelta: n(55, 2, 3, 4, 3) },
      { label: 'Peanut Butter', priceDelta: 30, nutritionDelta: n(95, 4, 3, 8, 1) },
      { label: 'Rolled Oats', priceDelta: 20, nutritionDelta: n(80, 3, 14, 1, 2) },
    ],
  },
  {
    key: 'extra-fruit', title: 'Extra fruit', type: 'multiple', maxSelect: 3, order: 3,
    options: [
      { label: 'Banana', priceDelta: 20, nutritionDelta: n(90, 1, 23, 0, 3) },
      { label: 'Mixed Berries', priceDelta: 40, nutritionDelta: n(50, 1, 12, 0, 3) },
      { label: 'Mango', priceDelta: 30, nutritionDelta: n(70, 1, 17, 0, 2) },
      { label: 'Apple', priceDelta: 20, nutritionDelta: n(55, 0, 14, 0, 2) },
    ],
  },
  {
    key: 'protein-scoop', title: 'Optional protein', type: 'single', order: 4,
    helpText: 'Plain whey isolate, unflavoured',
    options: [
      { label: 'No protein scoop', priceDelta: 0, isDefault: true, nutritionDelta: n() },
      { label: 'Half scoop', priceDelta: 40, nutritionDelta: n(60, 12, 1, 1, 0) },
      { label: 'Full scoop', priceDelta: 70, nutritionDelta: n(120, 24, 2, 2, 0) },
    ],
  },
];

const oatsJar = [
  {
    key: 'fruits', title: 'Fruits', type: 'multiple', maxSelect: 3, order: 1,
    helpText: 'Choose up to 3 seasonal fruits',
    options: [
      { label: 'Banana', priceDelta: 15, isDefault: true, nutritionDelta: n(90, 1, 23, 0, 3) },
      { label: 'Apple', priceDelta: 20, nutritionDelta: n(55, 0, 14, 0, 2) },
      { label: 'Mixed Berries', priceDelta: 40, nutritionDelta: n(50, 1, 12, 0, 3) },
      { label: 'Mango', priceDelta: 30, nutritionDelta: n(70, 1, 17, 0, 2) },
      { label: 'Pomegranate', priceDelta: 25, nutritionDelta: n(60, 1, 14, 1, 3) },
    ],
  },
  {
    key: 'nuts', title: 'Nuts', type: 'multiple', maxSelect: 3, order: 2,
    options: [
      { label: 'Almonds', priceDelta: 25, nutritionDelta: n(85, 3, 3, 7, 2) },
      { label: 'Walnuts', priceDelta: 30, nutritionDelta: n(95, 2, 2, 9, 1) },
      { label: 'Cashews', priceDelta: 25, nutritionDelta: n(90, 3, 5, 7, 1) },
      { label: 'Pistachios', priceDelta: 35, nutritionDelta: n(85, 3, 4, 7, 1) },
    ],
  },
  {
    key: 'seeds', title: 'Seeds', type: 'multiple', maxSelect: 3, order: 3,
    options: [
      { label: 'Chia Seeds', priceDelta: 20, nutritionDelta: n(58, 2, 5, 4, 4) },
      { label: 'Flax Seeds', priceDelta: 15, nutritionDelta: n(55, 2, 3, 4, 3) },
      { label: 'Sunflower Seeds', priceDelta: 20, nutritionDelta: n(70, 3, 3, 6, 1) },
      { label: 'Pumpkin Seeds', priceDelta: 25, nutritionDelta: n(75, 4, 2, 6, 1) },
    ],
  },
  {
    key: 'toppings', title: 'Finishing touch', type: 'multiple', maxSelect: 2, order: 4,
    options: [
      { label: 'Cocoa Powder', priceDelta: 15, nutritionDelta: n(25, 2, 4, 1, 3) },
      { label: 'Peanut Butter', priceDelta: 30, nutritionDelta: n(95, 4, 3, 8, 1) },
      { label: 'Honey', priceDelta: 15, nutritionDelta: n(65, 0, 17, 0, 0) },
      { label: 'Cinnamon', priceDelta: 10, nutritionDelta: n(6, 0, 2, 0, 1) },
    ],
  },
];

const sandwich = [
  {
    key: 'bread', title: 'Bread', type: 'single', required: true, order: 1,
    options: [
      { label: 'Multigrain', priceDelta: 0, isDefault: true, nutritionDelta: n(140, 6, 24, 2, 4) },
      { label: 'Whole Wheat', priceDelta: 0, nutritionDelta: n(135, 5, 25, 2, 3) },
      { label: 'Brown Bread', priceDelta: 0, nutritionDelta: n(130, 5, 24, 2, 3) },
    ],
  },
  {
    key: 'add-ons', title: 'Add-ons', type: 'multiple', maxSelect: 3, order: 2,
    options: [
      { label: 'Extra Paneer', priceDelta: 40, nutritionDelta: n(130, 11, 3, 8, 0) },
      { label: 'Boiled Egg', priceDelta: 25, nutritionDelta: n(78, 6, 1, 5, 0), tags: ['non-veg'] },
      { label: 'Sweet Corn', priceDelta: 15, nutritionDelta: n(45, 2, 9, 1, 2) },
      { label: 'Avocado Spread', priceDelta: 45, nutritionDelta: n(90, 1, 5, 8, 3) },
    ],
  },
  {
    key: 'spread', title: 'Spread', type: 'single', order: 3,
    options: [
      { label: 'Mint Chutney', priceDelta: 0, isDefault: true, nutritionDelta: n(15, 0, 3, 0, 1) },
      { label: 'Hummus', priceDelta: 25, nutritionDelta: n(70, 3, 6, 4, 2) },
      { label: 'Hung Curd Dip', priceDelta: 15, nutritionDelta: n(45, 4, 3, 2, 0) },
      { label: 'No spread', priceDelta: 0, nutritionDelta: n() },
    ],
  },
];

const cutlet = [
  {
    key: 'portion', title: 'Portion', type: 'single', required: true, order: 1,
    options: [
      { label: '2 pieces', priceDelta: 0, isDefault: true, nutritionDelta: n() },
      { label: '3 pieces', priceDelta: 45, nutritionDelta: n(95, 4, 12, 3, 2) },
      { label: '4 pieces', priceDelta: 85, nutritionDelta: n(190, 8, 24, 6, 4) },
    ],
  },
  {
    key: 'dip', title: 'Dip', type: 'single', order: 2,
    options: [
      { label: 'Mint Chutney', priceDelta: 0, isDefault: true, nutritionDelta: n(15, 0, 3, 0, 1) },
      { label: 'Yogurt Dip', priceDelta: 20, nutritionDelta: n(45, 4, 3, 2, 0) },
      { label: 'Hummus', priceDelta: 25, nutritionDelta: n(70, 3, 6, 4, 2) },
      { label: 'Tamarind Chutney', priceDelta: 15, nutritionDelta: n(40, 0, 10, 0, 0) },
    ],
  },
];

module.exports = { salad, wrap, smoothie, oatsJar, sandwich, cutlet };
