'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const { uploadBuffer, destroy, isConfigured } = require('../config/cloudinary');
const env = require('../config/env');

/** POST /uploads/images - admin image upload. Only Cloudinary URLs + ids are stored. */
exports.images = asyncHandler(async (req, res) => {
  if (!isConfigured) throw ApiError.badRequest('Cloudinary is not configured on this server');
  if (!req.files?.length) throw ApiError.badRequest('Please choose at least one image');

  // Whitelisted so a caller cannot walk out of the configured Cloudinary folder.
  const FOLDERS = ['products', 'categories', 'branding', 'avatars'];
  const requested = req.body.folder || 'products';
  if (!FOLDERS.includes(requested)) throw ApiError.badRequest('Unknown upload folder');

  const folder = env.cloudinary.folder + '/' + requested;
  const uploaded = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer, { folder })));

  return ok(res, {
    message: 'Images uploaded',
    data: uploaded.map((u) => ({ url: u.url, publicId: u.publicId, width: u.width, height: u.height })),
  });
});

/**
 * DELETE /uploads/:publicId - remove an asset from Cloudinary.
 *
 * The public id is scoped to this project's configured folder. The Cloudinary
 * credentials cover the whole account, so an unscoped id let a compromised or
 * careless admin session destroy assets belonging to any other product using
 * the same Cloudinary account.
 */
exports.remove = asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId || '').trim();
  const root = env.cloudinary.folder;

  if (!publicId || publicId.includes('..') || !/^[\w\-./]+$/.test(publicId)) {
    throw ApiError.badRequest('Invalid image reference');
  }
  if (publicId !== root && !publicId.startsWith(root + '/')) {
    throw ApiError.forbidden('This image does not belong to this store');
  }

  await destroy(publicId);
  return ok(res, { message: 'Image deleted' });
});
