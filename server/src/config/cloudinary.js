'use strict';
const { v2: cloudinary } = require('cloudinary');
const env = require('./env');
const logger = require('./logger');

const isConfigured = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
} else {
  logger.warn('Cloudinary is not configured - image uploads will be rejected.');
}

/** Upload a buffer to Cloudinary; resolves to { url, publicId, width, height, format }. */
function uploadBuffer(buffer, { folder = env.cloudinary.folder, publicId } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'image', overwrite: true },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );
    stream.end(buffer);
  });
}

async function destroy(publicId) {
  if (!isConfigured || !publicId) return null;
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { cloudinary, uploadBuffer, destroy, isConfigured };
