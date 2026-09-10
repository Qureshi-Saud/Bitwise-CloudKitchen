'use strict';
class ApiError extends Error {
  constructor(statusCode, message, { code, errors, isOperational = true } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || undefined;
    this.errors = errors || undefined;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(m = 'Bad request', o) { return new ApiError(400, m, o); }
  static unauthorized(m = 'Authentication required', o) { return new ApiError(401, m, o); }
  static forbidden(m = 'You do not have permission to perform this action', o) { return new ApiError(403, m, o); }
  static notFound(m = 'Resource not found', o) { return new ApiError(404, m, o); }
  static conflict(m = 'Resource already exists', o) { return new ApiError(409, m, o); }
  static tooMany(m = 'Too many requests', o) { return new ApiError(429, m, o); }
  static internal(m = 'Something went wrong', o) { return new ApiError(500, m, { ...o, isOperational: false }); }
}
module.exports = ApiError;
