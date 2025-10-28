import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { HealthService } from './health.service';

/**
 * Controller for health check endpoints
 * Provides /health/live and /health/ready endpoints
 */
@Controller()
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	/**
	 * Liveness endpoint
	 * Basic health check to determine if the service is alive
	 */
	@Get('health/live')
	@HealthCheck()
	async checkLiveness() {
		return await this.healthService.checkLiveness();
	}

	/**
	 * Readiness endpoint
	 * Comprehensive health check to determine if the service is ready to serve traffic
	 */
	@Get('health/ready')
	@HealthCheck()
	async checkReadiness() {
		return await this.healthService.checkReadiness();
	}

	/**
	 * Alternative liveness endpoint (configurable)
	 */
	@Get('live')
	@HealthCheck()
	async checkLivenessAlt() {
		return await this.healthService.checkLiveness();
	}

	/**
	 * Alternative readiness endpoint (configurable)
	 */
	@Get('ready')
	@HealthCheck()
	async checkReadinessAlt() {
		return await this.healthService.checkReadiness();
	}
}
