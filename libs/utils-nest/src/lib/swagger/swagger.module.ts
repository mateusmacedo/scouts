import { Module, DynamicModule } from '@nestjs/common';
import { SwaggerService } from './swagger.service';
import { SWAGGER_OPTIONS_TOKEN } from './constants';
import { SwaggerModuleOptions, SwaggerModuleAsyncOptions } from './swagger.interface';

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
