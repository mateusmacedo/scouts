import { DynamicModule } from '@nestjs/common';
import { SWAGGER_OPTIONS_TOKEN } from './constants';
import { SwaggerModuleAsyncOptions, SwaggerModuleOptions } from './swagger.interface';
import { SwaggerService } from './swagger.service';

/**
 * Configure the swagger module with synchronous options
 */
export function createSwaggerModule(options: SwaggerModuleOptions): DynamicModule {
	return {
		module: class SwaggerModule {},
		providers: [{ provide: SWAGGER_OPTIONS_TOKEN, useValue: options }, SwaggerService],
		exports: [SwaggerService],
	};
}

/**
 * Configure the swagger module with asynchronous options
 */
export function createSwaggerModuleAsync(options: SwaggerModuleAsyncOptions): DynamicModule {
	return {
		module: class SwaggerModule {},
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
