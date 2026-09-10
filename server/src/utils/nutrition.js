'use strict';
const KEYS = ['calories', 'protein', 'carbs', 'fat', 'fibre'];

const emptyNutrition = () => KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {});

function addNutrition(a = {}, b = {}) {
  const out = {};
  for (const k of KEYS) out[k] = round(Number(a[k] || 0) + Number(b[k] || 0));
  return out;
}

function scaleNutrition(n = {}, factor = 1) {
  const out = {};
  for (const k of KEYS) out[k] = round(Number(n[k] || 0) * factor);
  return out;
}

const round = (n) => Math.round(Number(n) * 10) / 10;

module.exports = { emptyNutrition, addNutrition, scaleNutrition, round };
