import { HealthIndicatorResult } from '@nestjs/terminus';

/**
 * Interface for custom health indicators
 * Useful for future circuit breaker integration
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class DatabaseHealthIndicator implements CustomHealthIndicator {
 *   async check(): Promise<HealthIndicatorResult> {
 *     const isHealthy = await this.checkDatabase();
 *     return { database: { status: isHealthy ? 'up' : 'down' } };
 *   }
 * }
 * ```
 */
export interface CustomHealthIndicator {
	check(): Promise<HealthIndicatorResult>;
}
