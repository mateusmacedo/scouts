import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HEALTH_OPTIONS_TOKEN } from './constants';
import { HealthController } from './health.controller';
import { HealthCheckAsyncOptions, HealthCheckOptions } from './health.interface';
import { HealthService } from './health.service';

/**
 * Dynamic module for health checks
 * Provides configurable health check functionality using @nestjs/terminus
 */
@Module({})
export class HealthModule {
	/**
	 * Configure the health module with synchronous options
	 */
	static forRoot(options?: HealthCheckOptions): DynamicModule {
		return {
			module: HealthModule,
			imports: [TerminusModule, HttpModule],
			controllers: [HealthController],
			providers: [{ provide: HEALTH_OPTIONS_TOKEN, useValue: options || {} }, HealthService],
			exports: [HealthService],
		};
	}

	/**
	 * Configure the health module with asynchronous options
	 */
	static forRootAsync(options: HealthCheckAsyncOptions): DynamicModule {
		return {
			module: HealthModule,
			imports: [TerminusModule, HttpModule, ...(options.imports || [])],
			controllers: [HealthController],
			providers: [
				{
					provide: HEALTH_OPTIONS_TOKEN,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				HealthService,
			],
			exports: [HealthService],
		};
	}
}
