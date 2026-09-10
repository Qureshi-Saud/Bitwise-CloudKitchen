'use strict';
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const env = require('../config/env');

const notFound = (req, _res, next) =>
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error?.name === 'ValidationError') {
      error = ApiError.badRequest('Validation failed', {
        code: 'VALIDATION_ERROR',
        errors: Object.values(error.errors || {}).map((e) => ({ field: e.path, message: e.message })),
      });
    } else if (error?.name === 'CastError') {
      error = ApiError.badRequest(`Invalid value supplied for ${error.path}`, { code: 'INVALID_ID' });
    } else if (error?.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      error = ApiError.conflict(`This ${field} is already in use`, { code: 'DUPLICATE_KEY' });
    } else if (error?.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Session expired, please sign in again', { code: 'TOKEN_EXPIRED' });
    } else if (error?.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid token', { code: 'TOKEN_INVALID' });
    } else if (error?.type === 'entity.too.large') {
      error = ApiError.badRequest('Payload too large', { code: 'PAYLOAD_TOO_LARGE' });
    } else {
      error = ApiError.internal(error?.message || 'Something went wrong');
    }
  }

  const status = error.statusCode || 500;

  if (status >= 500 || !error.isOperational) {
    logger.error(`${req.method} ${req.originalUrl} -> ${error.message}`);
    if (err.stack) logger.error(err.stack);
  }

  // Unexpected failures carry driver/library text - connection strings, schema
  // and file paths among them. That belongs in the log, not in the response.
  const message = status >= 500 && env.isProd
    ? 'Something went wrong. Please try again.'
    : error.message;

  res.status(status).json({
    success: false,
    message,
    code: error.code,
    errors: error.errors,
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
