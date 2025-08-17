import { Request, Response, NextFunction } from 'express';
import logger from '@/config/logger';
import { RateLimitError, ProxyError, CustomError } from '@/config/errors';
import env from '@/config/env';

interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (error instanceof RateLimitError) {
    statusCode = error.statusCode;
    message = error.message;
    logger.warn(`Rate limit error: ${message}`);
  } else if (error instanceof ProxyError) {
    statusCode = error.statusCode;
    message = error.message;
    logger.error(`Proxy error: ${message}`);
  } else if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    logger.error(`Custom error: ${message}`);
  } else {
    // Handle unknown errors
    logger.error(`Unhandled error: ${error.message}`, {
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Don't send error details in production
  if (env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    statusCode,
  };

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
