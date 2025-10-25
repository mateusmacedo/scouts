import { Test, TestingModule } from '@nestjs/testing';
import { SWAGGER_OPTIONS_TOKEN } from './constants';
import { SwaggerModuleAsyncOptions, SwaggerModuleOptions } from './swagger.interface';
import { createSwaggerModule, createSwaggerModuleAsync } from './swagger.module';
import { SwaggerService } from './swagger.service';

// Mock SwaggerService since it depends on @nestjs/swagger
jest.mock('./swagger.service', () => ({
	SwaggerService: jest.fn().mockImplementation((options) => ({
		getConfiguration: jest.fn().mockReturnValue(options || {}),
		getDocumentAsJson: jest.fn().mockReturnValue('{}'),
		getDocumentAsYaml: jest.fn().mockReturnValue('yaml content'),
		setup: jest.fn().mockResolvedValue(undefined),
		setupMultipleDocuments: jest.fn().mockResolvedValue(undefined),
	})),
}));

describe('SwaggerModule', () => {
	const mockOptions: SwaggerModuleOptions = {
		title: 'Test API',
		description: 'Test API Description',
		version: '1.0.0',
	};

	describe('createSwaggerModule', () => {
		it('should create module with synchronous options', () => {
			const dynamicModule = createSwaggerModule(mockOptions);

			expect(dynamicModule.module).toBeDefined();
			expect(dynamicModule.providers).toHaveLength(2);
			expect(dynamicModule.providers).toContainEqual({
				provide: SWAGGER_OPTIONS_TOKEN,
				useValue: mockOptions,
			});
			expect(dynamicModule.providers).toContain(SwaggerService);
			expect(dynamicModule.exports).toContain(SwaggerService);
		});

		it('should create module with default options', () => {
			const dynamicModule = createSwaggerModule({} as SwaggerModuleOptions);

			expect(dynamicModule.module).toBeDefined();
			expect(dynamicModule.providers).toHaveLength(2);
		});
	});

	describe('createSwaggerModuleAsync', () => {
		it('should create module with asynchronous options', () => {
			const asyncOptions: SwaggerModuleAsyncOptions = {
				useFactory: () => Promise.resolve(mockOptions),
				inject: [],
			};

			const dynamicModule = createSwaggerModuleAsync(asyncOptions);

			expect(dynamicModule.module).toBeDefined();
			expect(dynamicModule.providers).toHaveLength(2);
			expect(dynamicModule.providers).toContainEqual({
				provide: SWAGGER_OPTIONS_TOKEN,
				useFactory: asyncOptions.useFactory,
				inject: asyncOptions.inject,
			});
			expect(dynamicModule.providers).toContain(SwaggerService);
			expect(dynamicModule.exports).toContain(SwaggerService);
		});

		it('should create module with imports', () => {
			const asyncOptions: SwaggerModuleAsyncOptions = {
				imports: [Test],
				useFactory: () => mockOptions,
				inject: [],
			};

			const dynamicModule = createSwaggerModuleAsync(asyncOptions);

			expect(dynamicModule.imports).toContain(Test);
			expect(dynamicModule.providers).toHaveLength(2);
		});

		it('should handle empty imports array', () => {
			const asyncOptions: SwaggerModuleAsyncOptions = {
				useFactory: () => mockOptions,
			};

			const dynamicModule = createSwaggerModuleAsync(asyncOptions);

			expect(dynamicModule.imports).toEqual([]);
		});
	});

	describe('module integration', () => {
		it('should create working module with createSwaggerModule', async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [createSwaggerModule(mockOptions)],
			}).compile();

			const swaggerService = module.get<SwaggerService>(SwaggerService);
			expect(swaggerService).toBeDefined();
			expect(swaggerService.getConfiguration()).toBeDefined();
		});

		it('should create working module with createSwaggerModuleAsync', async () => {
			const asyncOptions: SwaggerModuleAsyncOptions = {
				useFactory: () => mockOptions,
			};

			const module: TestingModule = await Test.createTestingModule({
				imports: [createSwaggerModuleAsync(asyncOptions)],
			}).compile();

			const swaggerService = module.get<SwaggerService>(SwaggerService);
			expect(swaggerService).toBeDefined();
			expect(swaggerService.getConfiguration()).toBeDefined();
		});
	});
});
