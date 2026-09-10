'use strict';
const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');
const { clean } = require('../utils/sanitize');

/**
 * Validates and REPLACES req.body / req.query / req.params with the parsed data,
 * so controllers only ever see whitelisted, type-coerced, XSS-cleaned values.
 */
const validate = (schemas = {}) => (req, _res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      if (!schemas[key]) continue;
      const safe = clean(schemas[key].parse(req[key]));
      if (key === 'query') {
        Object.defineProperty(req, 'query', { value: safe, writable: true, configurable: true });
      } else {
        req[key] = safe;
      }
    }
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      return next(
        ApiError.badRequest('Validation failed', {
          code: 'VALIDATION_ERROR',
          errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        })
      );
    }
    return next(err);
  }
};

module.exports = validate;
