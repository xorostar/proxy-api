import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import logger from './config/logger';
import { errorHandler } from './middleware/error-handler.middleware';

const app = express();

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

export default app;
