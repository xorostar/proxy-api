import winston from 'winston';
import path from 'path';
import { env } from './env';

const logDir = 'logs';

// In test environment, create a silent logger else create a proper logger
const logger =
  env.NODE_ENV === 'test'
    ? winston.createLogger({
        silent: true,
      })
    : winston.createLogger({
        level: env.LOG_LEVEL,
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        defaultMeta: { service: 'express-api' },
        transports: [
          // Write all logs with importance level of `error` or less to `error.log`
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
          }),

          // Write all logs with importance level of `info` or less to `combined.log`
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
          }),
        ],
      });

// If we're not in production and not in test environment, log to the console too
if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
