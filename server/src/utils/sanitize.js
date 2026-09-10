'use strict';
const xss = require('xss');

const clean = (value) => {
  if (typeof value === 'string') return xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
  }
  return value;
};

module.exports = { clean };
