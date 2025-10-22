import { DynamicModule, Module } from '@nestjs/common';
import { createComposedLogger, createRedactor } from '@scouts/logger-node';
import { LOGGER_OPTIONS_TOKEN, LOGGER_TOKEN } from './constants';
import { NestLoggerModuleAsyncOptions, NestLoggerModuleOptions } from './logger.interface';
import { NestLoggerService } from './nest-logger.service';

/**
 * Dynamic module for NestJS Logger integration with @scouts/logger-node
 * Provides configurable logging with metrics, redaction, and correlation ID support
 */
@Module({})
export class LoggerModule {
	/**
	 * Configure the logger module with synchronous options
	 */
	static forRoot(options: NestLoggerModuleOptions = {}): DynamicModule {
		return {
			module: LoggerModule,
			providers: [
				{
					provide: LOGGER_OPTIONS_TOKEN,
					useValue: options,
				},
				{
					provide: LOGGER_TOKEN,
					useFactory: (opts: NestLoggerModuleOptions) => {
						const defaultRedactKeys = ['password', 'token', 'cardNumber', 'ssn'];
						const allRedactKeys = [...defaultRedactKeys, ...(opts.redactKeys || [])];

						return createComposedLogger({
							enableMetrics: opts.enableMetrics || false,
							redactor: createRedactor({
								keys: allRedactKeys,
							}),
							sinkOptions: {
								service: opts.service || process.env['SERVICE_NAME'] || 'nestjs-app',
								environment: opts.environment || process.env['NODE_ENV'] || 'development',
								version: opts.version || process.env['SERVICE_VERSION'] || '1.0.0',
							},
						});
					},
					inject: [LOGGER_OPTIONS_TOKEN],
				},
				NestLoggerService,
			],
			exports: [NestLoggerService, LOGGER_TOKEN],
		};
	}

	/**
	 * Configure the logger module with asynchronous options
	 */
	static forRootAsync(options: NestLoggerModuleAsyncOptions): DynamicModule {
		return {
			module: LoggerModule,
			imports: [...(options.imports || [])],
			providers: [
				{
					provide: LOGGER_OPTIONS_TOKEN,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				{
					provide: LOGGER_TOKEN,
					useFactory: (opts: NestLoggerModuleOptions) => {
						const defaultRedactKeys = ['password', 'token', 'cardNumber', 'ssn'];
						const allRedactKeys = [...defaultRedactKeys, ...(opts.redactKeys || [])];

						return createComposedLogger({
							enableMetrics: opts.enableMetrics || false,
							redactor: createRedactor({
								keys: allRedactKeys,
							}),
							sinkOptions: {
								service: opts.service || process.env['SERVICE_NAME'] || 'nestjs-app',
								environment: opts.environment || process.env['NODE_ENV'] || 'development',
								version: opts.version || process.env['SERVICE_VERSION'] || '1.0.0',
							},
						});
					},
					inject: [LOGGER_OPTIONS_TOKEN],
				},
				NestLoggerService,
			],
			exports: [NestLoggerService, LOGGER_TOKEN],
		};
	}
}
