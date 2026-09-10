'use strict';
/** Standard success envelope: { success, message, data, meta } */
function ok(res, { message = 'Success', data = null, meta, status = 200 } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}
const created = (res, opts = {}) => ok(res, { status: 201, message: 'Created', ...opts });
module.exports = { ok, created };
