import axios, { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import proxiesData from '../../proxies.json';
import logger from '@/config/logger';
import { Proxy, ScrapeResult, ProxyAxiosConfig } from '@/types';
import rateLimiterService from './rateLimiter.service';
import { RateLimitError } from '@/config/errors';

class ScraperService {
  private proxies: Proxy[];
  private maxRetries: number = 3;
  private timeout: number = 10000;

  constructor() {
    this.proxies = proxiesData.proxies;
  }

  /**
   * Get a random proxy from the list that is not rate limited
   */
  private async getRandomProxy(): Promise<Proxy> {
    const maxAttempts = this.proxies.length;

    let attempts = 0;

    while (attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * this.proxies.length);
      const proxy = this.proxies[randomIndex];

      if (!proxy) {
        throw new Error('No proxies available');
      }

      // Check if proxy is rate limited
      const isRateLimited = await rateLimiterService.isRateLimited(proxy);

      if (!isRateLimited) {
        logger.debug(
          `Selected non-rate-limited proxy: ${proxy.ip_address}:${proxy.port} (${proxy.requests_per_second} req/s)`
        );
        return proxy;
      }

      attempts++;
      logger.debug(
        `Proxy ${proxy.ip_address}:${proxy.port} is rate limited, trying another...`
      );
    }

    throw new RateLimitError('You have hit the rate limit on all proxies');
  }

  /**
   * Create axios instance with proxy configuration
   */
  private createAxiosInstance(proxy: Proxy) {
    const proxyUrl = `${proxy.https ? 'https' : 'http'}://${proxy.ip_address}:${proxy.port}`;

    const config: ProxyAxiosConfig = {
      timeout: this.timeout,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    };

    // Configure proxy agent
    if (proxy.https) {
      config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    } else {
      config.httpAgent = new HttpProxyAgent(proxyUrl);
    }

    return axios.create(config);
  }

  /**
   * Scrape a URL using proxy with retry logic
   */
  async scrapeUrl(url: string): Promise<ScrapeResult> {
    const usedProxies = new Set<string>();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      // Get a random proxy that hasn't been used yet
      let proxy: Proxy;
      let attempts = 0;
      const maxProxyAttempts = 10;

      do {
        proxy = await this.getRandomProxy();
        attempts++;
        if (attempts > maxProxyAttempts) {
          throw new Error(
            'Unable to find an unused proxy after multiple attempts'
          );
        }
      } while (usedProxies.has(`${proxy.ip_address}:${proxy.port}`));

      usedProxies.add(`${proxy.ip_address}:${proxy.port}`);

      try {
        logger.info(
          `Attempt ${attempt}: Scraping ${url} using proxy ${proxy.ip_address}:${proxy.port} (${proxy.country})`
        );

        // Increment rate limit counter before making the request
        await rateLimiterService.incrementRequest(proxy);

        const axiosInstance = this.createAxiosInstance(proxy);
        const response: AxiosResponse = await axiosInstance.get(url);

        // Check if response is successful
        if (response.status >= 200 && response.status < 300) {
          logger.info(
            `Successfully scraped ${url} using proxy ${proxy.ip_address}:${proxy.port}`
          );

          return {
            html: response.data,
            headers: response.headers as Record<string, string>,
            statusCode: response.status,
            proxyUsed: proxy,
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        lastError = error instanceof Error ? error : new Error(errorMessage);
        logger.warn(
          `Attempt ${attempt} failed for ${url} using proxy ${proxy.ip_address}:${proxy.port}: ${errorMessage}`
        );

        if (attempt === this.maxRetries) {
          logger.error(`All ${this.maxRetries} attempts failed for ${url}`);
          throw new Error(
            `Failed to scrape ${url} after ${this.maxRetries} attempts. Last error: ${errorMessage}`
          );
        }

        // Wait a bit before retrying
        await this.delay(1000 * attempt);
      }
    }

    throw lastError || new Error('Unknown error occurred during scraping');
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const scraperService = new ScraperService();
export default scraperService;
