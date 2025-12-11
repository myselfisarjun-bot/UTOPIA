import { withRetry } from './retry';

describe('Retry Utility', () => {
  jest.setTimeout(10000);

  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await withRetry(fn, { maxAttempts: 1, delayMs: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, {
      maxAttempts: 3,
      delayMs: 10,
      exponentialBackoff: false,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max attempts', async () => {
    const error = new Error('Persistent failure');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, { maxAttempts: 3, delayMs: 10, exponentialBackoff: false })
    ).rejects.toThrow('Persistent failure');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should call onRetry callback on each retry', async () => {
    const onRetry = jest.fn();
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');

    await withRetry(fn, { maxAttempts: 2, delayMs: 10, onRetry, exponentialBackoff: false });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('should use exponential backoff by default', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValue('success');

    const startTime = Date.now();
    await withRetry(fn, { maxAttempts: 3, delayMs: 10 });
    const duration = Date.now() - startTime;

    expect(fn).toHaveBeenCalledTimes(3);
    expect(duration).toBeGreaterThanOrEqual(30);
  });
});
