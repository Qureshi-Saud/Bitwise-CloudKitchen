'use strict';
const winston = require('winston');
const env = require('./env');

const logger = winston.createLogger({
  level: env.isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.isProd
      // `raw` is a console-only presentation flag, so it never reaches the JSON logs.
      ? winston.format.combine(
          winston.format((info) => { delete info.raw; return info; })(),
          winston.format.json()
        )
      // Lines logged with { raw: true } (the startup banner) print bare, without
      // the timestamp/level prefix.
      : winston.format.printf(({ level, message, timestamp, stack, raw }) =>
          raw
            ? `${stack || message}`
            : `${timestamp} [${level.toUpperCase()}] ${stack || message}`)
  ),
  transports: [new winston.transports.Console()],
});

logger.stream = { write: (msg) => logger.http?.(msg.trim()) || logger.info(msg.trim()) };

module.exports = logger;
