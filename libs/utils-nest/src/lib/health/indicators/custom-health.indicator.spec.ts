import { CustomHealthIndicator } from './custom-health.indicator';
import { HealthIndicatorResult } from '@nestjs/terminus';

describe('CustomHealthIndicator', () => {
	describe('Interface', () => {
		it('should define check() method that returns Promise<HealthIndicatorResult>', () => {
			class TestIndicator implements CustomHealthIndicator {
				async check(): Promise<HealthIndicatorResult> {
					return { test: { status: 'up' as const } };
				}
			}

			const indicator = new TestIndicator();
			expect(typeof indicator.check).toBe('function');
		});

		it('should allow custom implementation', async () => {
			class TestIndicator implements CustomHealthIndicator {
				async check(): Promise<HealthIndicatorResult> {
					return { test: { status: 'up' as const } };
				}
			}

			const indicator = new TestIndicator();
			const result = await indicator.check();

			expect(result).toEqual({ test: { status: 'up' } });
		});

		it('should allow custom implementation with down status', async () => {
			class TestIndicator implements CustomHealthIndicator {
				async check(): Promise<HealthIndicatorResult> {
					return { test: { status: 'down' as const, message: 'Service unavailable' } };
				}
			}

			const indicator = new TestIndicator();
			const result = await indicator.check();

			expect(result).toEqual({ test: { status: 'down', message: 'Service unavailable' } });
		});

		it('should allow async operations', async () => {
			class TestIndicator implements CustomHealthIndicator {
				async check(): Promise<HealthIndicatorResult> {
					// Simulate async operation
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { async_test: { status: 'up' as const } };
				}
			}

			const indicator = new TestIndicator();
			const result = await indicator.check();

			expect(result).toEqual({ async_test: { status: 'up' } });
		});

		it('should allow error handling', async () => {
			class TestIndicator implements CustomHealthIndicator {
				async check(): Promise<HealthIndicatorResult> {
					throw new Error('Health check failed');
				}
			}

			const indicator = new TestIndicator();

			await expect(indicator.check()).rejects.toThrow('Health check failed');
		});
	});
});
