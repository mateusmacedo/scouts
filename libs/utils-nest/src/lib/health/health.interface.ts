import { DynamicModule, Type } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';

/**
 * Configuration for HTTP health indicators
 */
export interface HttpIndicatorConfig {
	name: string;
	url: string;
	timeout?: number;
}

/**
 * Configuration for memory health indicator
 */
export interface MemoryIndicatorConfig {
	heapThreshold?: number;
	rssThreshold?: number;
}

/**
 * Configuration for disk health indicator
 */
export interface DiskIndicatorConfig {
	path: string;
	thresholdPercent?: number;
	thresholdBytes?: number;
}

/**
 * Main configuration interface for Health Check Module
 */
export interface HealthCheckOptions {
	timeout?: number;
	indicators?: {
		http?: HttpIndicatorConfig[];
		memory?: MemoryIndicatorConfig;
		disk?: DiskIndicatorConfig;
	};
}

/**
 * Async configuration interface for Health Check Module
 */
export interface HealthCheckAsyncOptions<T extends HealthCheckOptions = HealthCheckOptions> {
	imports?: DynamicModule['imports'];
	useFactory: (...args: unknown[]) => Promise<T> | T;
	inject?: (string | symbol | Type)[];
}

/**
 * Result interface for health check operations
 */
export interface HealthCheckResult {
	status: 'ok' | 'error';
	info?: Record<string, HealthIndicatorResult>;
	error?: Record<string, HealthIndicatorResult>;
	details?: Record<string, HealthIndicatorResult>;
}
