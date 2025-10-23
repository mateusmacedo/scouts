import { DynamicModule, Module } from '@nestjs/common';
import { SWAGGER_OPTIONS_TOKEN } from './constants';
import { SwaggerModuleAsyncOptions, SwaggerModuleOptions } from './swagger.interface';
import { SwaggerService } from './swagger.service';

/**
 * Dynamic module for Swagger/OpenAPI configuration
 * Provides configurable Swagger documentation setup using @nestjs/swagger
 */
@Module({})
export class SwaggerModule {
	/**
	 * Configure the swagger module with synchronous options
	 */
	static forRoot(options: SwaggerModuleOptions): DynamicModule {
		return {
			module: SwaggerModule,
			providers: [{ provide: SWAGGER_OPTIONS_TOKEN, useValue: options }, SwaggerService],
			exports: [SwaggerService],
		};
	}

	/**
	 * Configure the swagger module with asynchronous options
	 */
	static forRootAsync(options: SwaggerModuleAsyncOptions): DynamicModule {
		return {
			module: SwaggerModule,
			imports: [...(options.imports || [])],
			providers: [
				{
					provide: SWAGGER_OPTIONS_TOKEN,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				SwaggerService,
			],
			exports: [SwaggerService],
		};
	}
}

