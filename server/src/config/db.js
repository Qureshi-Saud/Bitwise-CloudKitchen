'use strict';
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  const conn = await mongoose.connect(env.mongoUri, {
    autoIndex: !env.isProd,
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 20,
  });
  logger.info('✅ MongoDB Connected', { raw: true });
  return conn;
}

async function disconnectDB() {
  await mongoose.connection.close();
}

module.exports = { connectDB, disconnectDB };
