'use strict';
function getPagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limitRaw = parseInt(query.limit, 10) || 12;
  const limit = Math.min(Math.max(limitRaw, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}
function buildMeta({ page, limit, total }) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}
module.exports = { getPagination, buildMeta };
