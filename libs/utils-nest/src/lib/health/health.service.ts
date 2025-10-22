import { Inject, Injectable, Optional } from '@nestjs/common';
import {
	DiskHealthIndicator,
	HealthCheckService,
	HealthIndicatorResult,
	HttpHealthIndicator,
	MemoryHealthIndicator,
} from '@nestjs/terminus';
import { HEALTH_OPTIONS_TOKEN } from './constants';
import { HealthCheckOptions } from './health.interface';

/**
 * Service that orchestrates health checks using composition
 * Uses native Terminus indicators instead of problematic wrappers
 */
@Injectable()
export class HealthService {
	constructor(
		private readonly health: HealthCheckService,
		@Inject(HEALTH_OPTIONS_TOKEN) @Optional() private readonly options: HealthCheckOptions = {},
		@Optional() private readonly http?: HttpHealthIndicator,
		@Optional() private readonly memory?: MemoryHealthIndicator,
		@Optional() private readonly disk?: DiskHealthIndicator
	) {}

	/**
	 * Perform liveness check
	 * Basic health check to determine if the service is alive
	 */
	async checkLiveness() {
		return await this.health.check([async () => await this.checkMemory()]);
	}

	/**
	 * Perform readiness check
	 * Comprehensive health check to determine if the service is ready to serve traffic
	 */
	async checkReadiness() {
		return await this.health.check([
			async () => await this.checkMemory(),
			async () => await this.checkDisk(),
			async () => await this.checkHttpDependencies(),
			async () => this.checkCustomIndicators(),
		]);
	}

	/**
	 * Check memory usage
	 */
	private async checkMemory(): Promise<HealthIndicatorResult> {
		if (!this.options?.indicators?.memory || !this.memory) {
			return { memory: { status: 'up' } };
		}
		const config = this.options.indicators.memory;
		return await this.memory.checkHeap('memory_heap', config.heapThreshold || 150 * 1024 * 1024);
	}

	/**
	 * Check disk space
	 */
	private async checkDisk(): Promise<HealthIndicatorResult> {
		if (!this.options?.indicators?.disk || !this.disk) {
			return { disk: { status: 'up' } };
		}
		const config = this.options.indicators.disk;
		return await this.disk.checkStorage('disk', {
			path: config.path,
			thresholdPercent: config.thresholdPercent || 0.9,
		});
	}

	/**
	 * Check HTTP dependencies
	 */
	private async checkHttpDependencies(): Promise<HealthIndicatorResult> {
		if (
			!this.options?.indicators?.http ||
			!this.http ||
			this.options.indicators.http.length === 0
		) {
			return { http: { status: 'up' } };
		}
		const results = await Promise.all(
			this.options.indicators.http.map((cfg) =>
				this.http?.pingCheck(cfg.name, cfg.url, {
					timeout: cfg.timeout !== undefined ? cfg.timeout : 3000,
				})
			)
		);
		return Object.assign({}, ...results);
	}

	/**
	 * Check custom indicators (prepared for future circuit breaker integration)
	 */
	private checkCustomIndicators(): HealthIndicatorResult {
		return { custom: { status: 'up' } };
	}

	/**
	 * Get current configuration
	 */
	getConfiguration(): HealthCheckOptions {
		return this.options;
	}
}
