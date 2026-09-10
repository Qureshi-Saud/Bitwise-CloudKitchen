'use strict';
const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDB } = require('./config/db');
const { initSocket } = require('./sockets');
const settingsService = require('./services/settings.service');

async function bootstrap() {
  // Fails loudly before anything listens if a production secret is missing or weak.
  env.requireProdSecrets();

  await connectDB();

  // Warms the business-settings cache so synchronous readers (email templates,
  // health checks) have real values from the very first request.
  await settingsService.warm();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    logger.info('🚀 Server running on port ' + env.port, { raw: true });
  });

  const shutdown = (signal) => async () => {
    logger.info('Received ' + signal + ', shutting down gracefully...');
    server.close(async () => {
      const { disconnectDB } = require('./config/db');
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection: ' + (reason?.message || reason));
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception: ' + err.message);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server: ' + err.message);
  process.exit(1);
});
