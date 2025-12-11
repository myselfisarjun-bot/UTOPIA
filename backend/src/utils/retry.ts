import { config } from '../config';
import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = config.retry.maxAttempts,
    delayMs = config.retry.delayMs,
    exponentialBackoff = true,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        logger.error(
          {
            error: lastError,
            attempt,
            maxAttempts,
          },
          'Max retry attempts reached'
        );
        throw lastError;
      }

      const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

      logger.warn(
        {
          error: lastError.message,
          attempt,
          maxAttempts,
          nextRetryIn: delay,
        },
        'Operation failed, retrying...'
      );

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      await sleep(delay);
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
