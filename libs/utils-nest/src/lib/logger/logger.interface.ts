import { DynamicModule, Type } from '@nestjs/common';
import { LogLevel } from '@scouts/logger-node';

/**
 * Configuration options for NestJS Logger Module
 */
export interface NestLoggerModuleOptions {
	/**
	 * Enable metrics collection
	 * @default false
	 */
	enableMetrics?: boolean;

	/**
	 * Additional keys to redact (beyond defaults: password, token, cardNumber, ssn)
	 */
	redactKeys?: string[];

	/**
	 * Service name for log enrichment
	 * @default process.env.SERVICE_NAME || 'nestjs-app'
	 */
	service?: string;

	/**
	 * Environment for log enrichment
	 * @default process.env.NODE_ENV || 'development'
	 */
	environment?: string;

	/**
	 * Version for log enrichment
	 * @default process.env.SERVICE_VERSION || '1.0.0'
	 */
	version?: string;

	/**
	 * Default log level
	 * @default 'info'
	 */
	logLevel?: LogLevel;
}

/**
 * Async configuration options for NestJS Logger Module
 */
export interface NestLoggerModuleAsyncOptions {
	imports?: DynamicModule['imports'];
	useFactory: (...args: unknown[]) => Promise<NestLoggerModuleOptions> | NestLoggerModuleOptions;
	inject?: (string | symbol | Type)[];
}

