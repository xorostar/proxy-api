import { getRedisClient } from '@/config/redis';
import logger from '@/config/logger';
import { Proxy } from '@/types';

export class RateLimiterService {
  private static instance: RateLimiterService;
  private redis = getRedisClient();

  private constructor() {
    setTimeout(() => {
      this.redis = getRedisClient();
    }, 1000);
  }

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  async isRateLimited(proxy: Proxy): Promise<boolean> {
    try {
      const key = this.getProxyKey(proxy);
      const requestsPerSecond = proxy.requests_per_second || 1;
      const currentCount = await this.redis.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      if (count >= requestsPerSecond) {
        logger.debug(
          `Rate limit exceeded for proxy ${proxy.ip_address}:${proxy.port} (${count}/${requestsPerSecond} req/s)`
        );
        return true;
      }

      return false;
    } catch (error) {
      logger.error(
        `Failed to check rate limit for proxy ${proxy.ip_address}:${proxy.port}:`,
        error
      );
      return false;
    }
  }

  async incrementRequest(proxy: Proxy): Promise<void> {
    try {
      const key = this.getProxyKey(proxy);
      const pipeline = this.redis.multi();
      pipeline.incr(key);
      pipeline.expire(key, 1);
      await pipeline.exec();

      logger.debug(
        `Incremented request count for proxy ${proxy.ip_address}:${proxy.port}`
      );
    } catch (error) {
      logger.error(
        `Failed to increment rate limit for proxy ${proxy.ip_address}:${proxy.port}:`,
        error
      );
    }
  }

  private getProxyKey(proxy: Proxy): string {
    return `rate_limit:${proxy.ip_address}:${proxy.port}`;
  }
}

export const rateLimiterService = RateLimiterService.getInstance();
export default rateLimiterService;
