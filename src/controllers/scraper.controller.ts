import { Request, Response } from 'express';
import scraperService from '@/services/scraper.service';
import logger from '@/config/logger';
import { CustomError, RateLimitError } from '@/config/errors';

export class ScraperController {
  static async scrapeUrl(req: Request, res: Response): Promise<void> {
    const { url } = req.body;

    try {
      logger.info(`Starting scrape request for URL: ${url}`);

      const result = await scraperService.scrapeUrl(url);

      logger.info(
        `Scrape completed successfully for ${url} using proxy ${result.proxyUsed.ip_address}:${result.proxyUsed.port}`
      );

      res.status(200).json({
        success: true,
        data: {
          html: result.html,
          headers: result.headers,
          statusCode: result.statusCode,
          proxy: {
            ip: result.proxyUsed.ip_address,
            port: result.proxyUsed.port,
            country: result.proxyUsed.country,
            anonymity: result.proxyUsed.anonymity,
            https: result.proxyUsed.https,
          },
        },
      });
    } catch (error: unknown) {
      if (error instanceof RateLimitError) {
        logger.warn(`Rate limit exceeded for ${url}: ${error.message}`);
        res.status(429).json({
          success: false,
          error: error.message,
          statusCode: 429,
        });
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Scrape failed for ${url}: ${errorMessage}`);
      throw new CustomError(`Failed to scrape URL: ${errorMessage}`, 500);
    }
  }
}
