'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const settingsService = require('./services/settings.service');
const { notFound, errorHandler } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

// Behind a proxy (Render/Railway/Nginx) so req.ip and secure cookies work.
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* --------------------------------- Security -------------------------------- */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: env.isProd ? undefined : false,
}));

/**
 * The allowlist is exactly CLIENT_URL + ADMIN_URL, so pointing the same build
 * at local dev, staging or production is a two-variable change.
 */
const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server / curl / mobile clients that send no Origin header.
    if (!origin) return callback(null, true);
    if (env.cors.isAllowed(origin)) return callback(null, true);
    logger.warn('Blocked by CORS: ' + origin);
    return callback(new Error('This origin is not allowed by CORS policy'));
  },
  credentials: env.cors.credentials,
  methods: env.cors.methods,
  allowedHeaders: env.cors.allowedHeaders,
  maxAge: env.cors.maxAge,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* --------------------------------- Parsing --------------------------------- */
// Keep the raw body for the Razorpay webhook signature check.
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression());
app.use(mongoSanitize({ replaceWith: '_' }));

/* --------------------------------- Logging --------------------------------- */
app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: logger.stream }));

/* ---------------------------------- Routes --------------------------------- */
app.use(env.apiPrefix, apiLimiter, routes);

app.get('/', (_req, res) =>
  res.json({
    success: true,
    message: 'Server is working',
    data: {
      service: settingsService.snapshot().general.siteName + ' API',
      docs: env.apiPrefix + '/health',
      version: 'v1',
    },
  }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
