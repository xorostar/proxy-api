import { AppError } from '@/types';

export class RateLimitError extends Error {
  public readonly statusCode: number;
  public readonly isRateLimitError: boolean;

  constructor(message: string = 'All proxies are currently rate limited') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
    this.isRateLimitError = true;
  }
}

export class ProxyError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ProxyError';
    this.statusCode = statusCode;
  }
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
