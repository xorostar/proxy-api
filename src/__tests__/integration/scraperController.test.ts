import request from 'supertest';
import app from '../../index.test';

// Mock the scraper service
jest.mock('../../services/scraper.service', () => ({
  __esModule: true,
  default: {
    scrapeUrl: jest.fn(),
  },
}));

// Get the mocked function
const mockScrapeUrl = require('../../services/scraper.service').default
  .scrapeUrl;

describe('ScraperController', () => {
  beforeEach(() => {
    mockScrapeUrl.mockClear();
  });

  describe('POST /api/scraper/scrape', () => {
    it('should successfully scrape a valid URL', async () => {
      mockScrapeUrl.mockResolvedValue({
        html: '<html><body>Test content</body></html>',
        headers: { 'content-type': 'text/html' },
        statusCode: 200,
        proxyUsed: {
          ip_address: '173.209.63.70',
          port: 8040,
          country: 'CA',
          anonymity: 'anonymous',
          https: true,
        },
      });

      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({ url: 'https://example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('html');
      expect(response.body.data).toHaveProperty('headers');
      expect(response.body.data).toHaveProperty('statusCode', 200);
      expect(response.body.data).toHaveProperty('proxy');
    });

    it('should return 429 when all proxies are rate limited', async () => {
      const { RateLimitError } = require('../../config/errors');
      mockScrapeUrl.mockRejectedValue(
        new RateLimitError('You have hit the rate limit on all proxies')
      );

      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({ url: 'https://example.com' })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        'You have hit the rate limit on all proxies'
      );
      expect(response.body.statusCode).toBe(429);
    });

    it('should return 400 for missing URL', async () => {
      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid URL format', async () => {
      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({ url: 'invalid-url' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for non-HTTP/HTTPS URL', async () => {
      const response = await request(app)
        .post('/api/scraper/scrape')
        .send({ url: 'ftp://example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});
