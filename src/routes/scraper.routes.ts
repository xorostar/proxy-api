import { Router } from 'express';
import { body } from 'express-validator';
import { ScraperController } from '@/controllers/scraper.controller';
import { validate } from '@/middleware/validation.middleware';

const router = Router();

const scrapeUrlValidation = [
  body('url')
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Invalid URL format')
    .custom(value => {
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('URL must use HTTP or HTTPS protocol');
        }
        return true;
      } catch (error) {
        throw new Error('Invalid URL format');
      }
    }),
];

router.post(
  '/scrape',
  validate(scrapeUrlValidation),
  ScraperController.scrapeUrl
);

export default router;
