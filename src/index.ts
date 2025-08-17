import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import routes from '@/routes';
import { errorHandler } from '@/middleware/error-handler.middleware';
import logger from '@/config/logger';
import { env } from '@/config/env';
import { createRedisClient } from '@/config/redis';

const app = express();
const PORT = env.PORT;

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  logger.info({
    message: 'Incoming request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

app.use('/api', routes);
app.use(errorHandler);

const startServer = async () => {
  try {
    await createRedisClient();

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
