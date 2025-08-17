import request from 'supertest';
import app from '../../index.test';
import rateLimiterService from '@/services/rateLimiter.service';

jest.mock('@/services/rateLimiter.service', () => ({
  isRateLimited: jest.fn(),
  incrementRequest: jest.fn(),
}));

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

describe('Rate Limiting Integration', () => {
  const mockRateLimiter = rateLimiterService as jest.Mocked<
    typeof rateLimiterService
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/scraper/scrape', () => {
    it('should successfully scrape when proxy is not rate limited', async () => {
      const testUrl = 'https://example.com';
      const mockResponse = {
        data: '<html><body>Test content</body></html>',
        headers: { 'content-type': 'text/html' },
        status: 200,
      };

      mockRateLimiter.isRateLimited.mockResolvedValue(false);
      mockRateLimiter.incrementRequest.mockResolvedValue();

      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(mockResponse),
      };
      axios.create.mockReturnValue(mockAxiosInstance);

      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({ url: testUrl })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.html).toBe(
        '<html><body>Test content</body></html>'
      );
      expect(response.body.data.statusCode).toBe(200);
      expect(response.body.data.proxy).toBeDefined();

      expect(mockRateLimiter.isRateLimited).toHaveBeenCalled();
      expect(mockRateLimiter.incrementRequest).toHaveBeenCalled();
    });

    it('should try different proxy when first proxy is rate limited', async () => {
      const testUrl = 'https://example.com';
      const mockResponse = {
        data: '<html><body>Test content</body></html>',
        headers: { 'content-type': 'text/html' },
        status: 200,
      };

      mockRateLimiter.isRateLimited
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockRateLimiter.incrementRequest.mockResolvedValue();

      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(mockResponse),
      };
      axios.create.mockReturnValue(mockAxiosInstance);

      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({ url: testUrl })
        .expect(200);

      expect(response.body.success).toBe(true);

      expect(mockRateLimiter.isRateLimited).toHaveBeenCalledTimes(2);
      expect(mockRateLimiter.incrementRequest).toHaveBeenCalledTimes(1);
    });

    it('should return 429 when all proxies are rate limited', async () => {
      const testUrl = 'https://example.com';

      mockRateLimiter.isRateLimited.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({ url: testUrl })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        'You have hit the rate limit on all proxies'
      );
      expect(response.body.statusCode).toBe(429);

      expect(mockRateLimiter.isRateLimited).toHaveBeenCalled();
      expect(mockRateLimiter.incrementRequest).not.toHaveBeenCalled();
    });

    it('should handle rate limiter errors gracefully and still work', async () => {
      const testUrl = 'https://example.com';
      const mockResponse = {
        data: '<html><body>Test content</body></html>',
        headers: { 'content-type': 'text/html' },
        status: 200,
      };

      mockRateLimiter.isRateLimited.mockResolvedValue(false);
      mockRateLimiter.incrementRequest.mockResolvedValue();

      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(mockResponse),
      };
      axios.create.mockReturnValue(mockAxiosInstance);

      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({ url: testUrl })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.html).toBe(
        '<html><body>Test content</body></html>'
      );
    });
  });

  describe('Rate Limiting Behavior', () => {
    it('should increment rate limit before making request if proxy is not rate limited', async () => {
      const testUrl = 'https://example.com';
      const mockResponse = {
        data: '<html>Test</html>',
        headers: { 'content-type': 'text/html' },
        status: 200,
      };

      mockRateLimiter.isRateLimited.mockResolvedValue(false);
      mockRateLimiter.incrementRequest.mockResolvedValue();

      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(mockResponse),
      };
      axios.create.mockReturnValue(mockAxiosInstance);

      await request(app)
        .post('/api/scraper/scrape')
        .send({ url: testUrl })
        .expect(200);

      expect(mockRateLimiter.incrementRequest).toHaveBeenCalled();
    });

    it('should not increment rate limit if no proxy is available due to rate limiting', async () => {
      const testUrl = 'https://example.com';

      mockRateLimiter.isRateLimited.mockResolvedValue(true);

      await request(app)
        .post('/api/scraper/scrape')
        .send({ url: testUrl })
        .expect(429);

      expect(mockRateLimiter.incrementRequest).not.toHaveBeenCalled();
    });
  });
});
