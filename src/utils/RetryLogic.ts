/**
 * RetryLogic - Exponential backoff retry mechanism
 *
 * Provides robust retry logic for operations that may fail transiently:
 * - File I/O operations
 * - Network requests
 * - Resource contention scenarios
 *
 * Default strategy: 3 attempts with 100ms, 200ms, 400ms delays
 */

import { logger } from './Logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  exponentialBase?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: unknown;
  attempts: number;
  totalTimeMs: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
  exponentialBase: 2,
  shouldRetry: (error: unknown, attempt: number) => {
    // Retry on most errors, but not validation errors
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name;
      // Don't retry validation or schema errors - these won't fix themselves
      if (errorName === 'ValidationError' || errorName === 'MigrationError') {
        return false;
      }
    }
    return attempt < DEFAULT_OPTIONS.maxAttempts;
  }
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for current attempt using exponential backoff
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  exponentialBase: number,
  maxDelayMs: number
): number {
  const delay = baseDelayMs * Math.pow(exponentialBase, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to RetryResult with success status and result/error
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await fs.readFile(path, 'utf8'),
 *   { maxAttempts: 3, baseDelayMs: 100 }
 * );
 *
 * if (result.success) {
 *   console.log('Read file:', result.result);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts:', result.error);
 * }
 * ```
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: unknown;
  let attempt = 0;

  while (attempt < opts.maxAttempts) {
    attempt++;

    try {
      const result = await operation();
      const totalTimeMs = Date.now() - startTime;

      if (attempt > 1) {
        logger.info(`Operation succeeded on attempt ${attempt}/${opts.maxAttempts}`, {
          totalTimeMs,
          attempts: attempt
        });
      }

      return {
        success: true,
        result,
        attempts: attempt,
        totalTimeMs
      };
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = opts.shouldRetry
        ? opts.shouldRetry(error, attempt)
        : DEFAULT_OPTIONS.shouldRetry(error, attempt);

      if (!shouldRetry || attempt >= opts.maxAttempts) {
        // No more retries
        break;
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(
        attempt,
        opts.baseDelayMs,
        opts.exponentialBase,
        opts.maxDelayMs
      );

      logger.warn(
        `Operation failed on attempt ${attempt}/${opts.maxAttempts}, retrying in ${delayMs}ms`,
        { error, attempt, delayMs }
      );

      // Call retry callback if provided
      if (options.onRetry) {
        options.onRetry(error, attempt, delayMs);
      }

      // Wait before next attempt
      await sleep(delayMs);
    }
  }

  // All attempts failed
  const totalTimeMs = Date.now() - startTime;
  logger.error(
    `Operation failed after ${attempt} attempts in ${totalTimeMs}ms`,
    lastError
  );

  return {
    success: false,
    error: lastError,
    attempts: attempt,
    totalTimeMs
  };
}

/**
 * Simpler retry wrapper that throws on failure
 *
 * @param operation - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to operation result
 * @throws Last error if all retries fail
 *
 * @example
 * ```typescript
 * try {
 *   const data = await retry(
 *     async () => await fs.readFile(path, 'utf8'),
 *     { maxAttempts: 3 }
 *   );
 *   console.log('Success:', data);
 * } catch (error) {
 *   console.error('Failed:', error);
 * }
 * ```
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await retryWithBackoff(operation, options);

  if (result.success && result.result !== undefined) {
    return result.result;
  }

  // Ensure we always throw an Error object, not undefined
  if (result.error) {
    throw result.error;
  } else {
    throw new Error('Operation failed with unknown error');
  }
}

/**
 * Retry only file I/O operations (more aggressive retry policy)
 */
export async function retryFileOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return retry(operation, {
    maxAttempts: 3,
    baseDelayMs: 100,
    exponentialBase: 2,
    maxDelayMs: 1000,
    shouldRetry: (error: unknown, attempt: number) => {
      // Retry on file system errors
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        // Don't retry on file not found or permission errors
        if (code === 'ENOENT' || code === 'EACCES' || code === 'EPERM') {
          return false;
        }
      }
      return attempt < 3;
    },
    onRetry: (error, attempt, delayMs) => {
      logger.warn(
        `File operation "${operationName}" failed (attempt ${attempt}/3), retrying in ${delayMs}ms`,
        { error }
      );
    }
  });
}
