import { Router } from 'express';
import scraperRoutes from './scraper.routes';
import { env } from '@/config/env';
import { getRedisClient } from '@/config/redis';

const router = Router();

router.get('/health', async (req, res) => {
  const redisClient = getRedisClient();
  const redisStatus = redisClient ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    message: 'API is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      redis: redisStatus,
    },
  });
});

router.use('/scraper', scraperRoutes);

export default router;
