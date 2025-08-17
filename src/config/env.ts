import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: parseInt(process.env['PORT'] || '3000', 10),
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  LOG_FILE_PATH: process.env['LOG_FILE_PATH'] || 'logs/app.log',
  REDIS_URL: process.env['REDIS_URL'] || 'redis://localhost:6379',
} as const;

export default env;
