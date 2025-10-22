import { withRetry, createRetryWrapper, withRetryAndFallback, RetryPresets } from './retry';

describe('Retry Utils', () => {
	describe('withRetry', () => {
		it('should succeed on first attempt', async () => {
			const fn = jest.fn().mockResolvedValue('success');
			const result = await withRetry(fn);

			expect(result.success).toBe(true);
			expect(result.result).toBe('success');
			expect(result.attempts).toBe(1);
			expect(result.totalDelay).toBe(0);
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it('should retry on failure and eventually succeed', async () => {
			const fn = jest
				.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			const result = await withRetry(fn, { maxAttempts: 3 });

			expect(result.success).toBe(true);
			expect(result.result).toBe('success');
			expect(result.attempts).toBe(3);
			expect(result.totalDelay).toBeGreaterThan(0);
			expect(fn).toHaveBeenCalledTimes(3);
		});

		it('should fail after max attempts', async () => {
			const fn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

			const result = await withRetry(fn, { maxAttempts: 2 });

			expect(result.success).toBe(false);
			expect(result.error).toEqual(new Error('Persistent failure'));
			expect(result.attempts).toBe(2);
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it('should respect shouldRetry function', async () => {
			const fn = jest.fn().mockRejectedValue(new Error('Non-retryable error'));
			const shouldRetry = jest.fn().mockReturnValue(false);

			const result = await withRetry(fn, { shouldRetry });

			expect(result.success).toBe(false);
			expect(result.attempts).toBe(1);
			expect(shouldRetry).toHaveBeenCalledWith(new Error('Non-retryable error'), 1);
		});

		it('should use exponential backoff', async () => {
			const fn = jest
				.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockRejectedValueOnce(new Error('Second failure'))
				.mockResolvedValue('success');

			const result = await withRetry(fn, {
				maxAttempts: 3,
				initialDelay: 100,
				backoffMultiplier: 2,
			});

			expect(result.success).toBe(true);
			expect(result.totalDelay).toBeGreaterThanOrEqual(100); // At least first delay
		});
	});

	describe('createRetryWrapper', () => {
		it('should wrap function with retry logic', async () => {
			const originalFn = jest
				.fn()
				.mockRejectedValueOnce(new Error('First failure'))
				.mockResolvedValue('success');

			const wrappedFn = createRetryWrapper(originalFn, { maxAttempts: 2 });

			const result = await wrappedFn('arg1', 'arg2');

			expect(result).toBe('success');
			expect(originalFn).toHaveBeenCalledTimes(2);
			expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
		});

		it('should throw error if all retries fail', async () => {
			const originalFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
			const wrappedFn = createRetryWrapper(originalFn, { maxAttempts: 2 });

			await expect(wrappedFn()).rejects.toThrow('Persistent failure');
			expect(originalFn).toHaveBeenCalledTimes(2);
		});
	});

	describe('withRetryAndFallback', () => {
		it('should use fallback when retry fails', async () => {
			const fn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
			const fallback = jest.fn().mockResolvedValue('fallback success');

			const result = await withRetryAndFallback(fn, fallback, { maxAttempts: 2 });

			expect(result).toBe('fallback success');
			expect(fn).toHaveBeenCalledTimes(2);
			expect(fallback).toHaveBeenCalledTimes(1);
		});

		it('should not use fallback when retry succeeds', async () => {
			const fn = jest.fn().mockResolvedValue('success');
			const fallback = jest.fn().mockResolvedValue('fallback success');

			const result = await withRetryAndFallback(fn, fallback);

			expect(result).toBe('success');
			expect(fn).toHaveBeenCalledTimes(1);
			expect(fallback).not.toHaveBeenCalled();
		});
	});

	describe('RetryPresets', () => {
		it('should have correct fast preset', () => {
			expect(RetryPresets.fast).toEqual({
				maxAttempts: 3,
				initialDelay: 50,
				backoffMultiplier: 2,
				maxDelay: 200,
				jitter: 0.1,
			});
		});

		it('should have correct standard preset', () => {
			expect(RetryPresets.standard).toEqual({
				maxAttempts: 3,
				initialDelay: 100,
				backoffMultiplier: 2,
				maxDelay: 1000,
				jitter: 0.1,
			});
		});

		it('should have correct slow preset', () => {
			expect(RetryPresets.slow).toEqual({
				maxAttempts: 5,
				initialDelay: 200,
				backoffMultiplier: 2,
				maxDelay: 2000,
				jitter: 0.2,
			});
		});

		it('should have correct aggressive preset', () => {
			expect(RetryPresets.aggressive).toEqual({
				maxAttempts: 5,
				initialDelay: 50,
				backoffMultiplier: 1.5,
				maxDelay: 500,
				jitter: 0.05,
			});
		});
	});
});
