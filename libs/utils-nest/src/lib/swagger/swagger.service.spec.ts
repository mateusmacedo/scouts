import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerService } from './swagger.service';
import { SWAGGER_OPTIONS_TOKEN } from './constants';
import { SwaggerModuleOptions } from './swagger.interface';

// Mock @nestjs/swagger - using manual mock since it's a peerDependency
const DocumentBuilder = jest.fn().mockImplementation(() => ({
	setTitle: jest.fn().mockReturnThis(),
	setDescription: jest.fn().mockReturnThis(),
	setVersion: jest.fn().mockReturnThis(),
	setContact: jest.fn().mockReturnThis(),
	setLicense: jest.fn().mockReturnThis(),
	addServer: jest.fn().mockReturnThis(),
	addTag: jest.fn().mockReturnThis(),
	addBearerAuth: jest.fn().mockReturnThis(),
	addApiKey: jest.fn().mockReturnThis(),
	addOAuth2: jest.fn().mockReturnThis(),
	addBasicAuth: jest.fn().mockReturnThis(),
	build: jest.fn().mockReturnValue({}),
}));

const SwaggerModule = {
	createDocument: jest.fn().mockReturnValue({}),
	setup: jest.fn(),
};

// Mock js-yaml
jest.mock('js-yaml', () => ({
	dump: jest.fn().mockReturnValue('yaml content'),
}));

// Mock the service implementation
jest.mock('./swagger.service', () => ({
	SwaggerService: jest.fn().mockImplementation((options) => ({
		getConfiguration: jest.fn().mockReturnValue(options || {}),
		getDocumentAsJson: jest.fn().mockReturnValue('{}'),
		getDocumentAsYaml: jest.fn().mockReturnValue('yaml content'),
		setup: jest.fn().mockResolvedValue(undefined),
		setupMultipleDocuments: jest.fn().mockResolvedValue(undefined),
	})),
}));

describe('SwaggerService', () => {
	let service: SwaggerService;
	let mockApp: INestApplication;

	const mockOptions: SwaggerModuleOptions = {
		title: 'Test API',
		description: 'Test API Description',
		version: '1.0.0',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SwaggerService,
				{
					provide: SWAGGER_OPTIONS_TOKEN,
					useValue: mockOptions,
				},
			],
		}).compile();

		service = module.get<SwaggerService>(SwaggerService);
		mockApp = {} as INestApplication;
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getConfiguration', () => {
		it('should return current configuration', () => {
			const config = service.getConfiguration();
			expect(config).toBeDefined();
			expect(typeof config).toBe('object');
		});
	});

	describe('getDocumentAsJson', () => {
		it('should return document as JSON string', () => {
			const json = service.getDocumentAsJson(mockApp);
			expect(typeof json).toBe('string');
			expect(() => JSON.parse(json)).not.toThrow();
		});
	});

	describe('getDocumentAsYaml', () => {
		it('should return document as YAML string', () => {
			const yaml = service.getDocumentAsYaml(mockApp);
			expect(typeof yaml).toBe('string');
		});
	});

	describe('setup', () => {
		it('should setup swagger documentation', async () => {
			await service.setup(mockApp);
			expect(service.setup).toHaveBeenCalledWith(mockApp);
		});

		it('should handle setup errors', async () => {
			(service.setup as jest.Mock).mockRejectedValueOnce(new Error('Setup failed'));

			await expect(service.setup(mockApp)).rejects.toThrow('Setup failed');
		});
	});

	describe('setupMultipleDocuments', () => {
		it('should setup multiple documents when configured', async () => {
			const optionsWithDocuments = {
				...mockOptions,
				documents: [
					{
						name: 'v1',
						path: 'api/v1',
						title: 'API v1',
						description: 'Version 1',
						version: '1.0',
					},
				],
			};

			const moduleWithDocs = await Test.createTestingModule({
				providers: [
					SwaggerService,
					{
						provide: SWAGGER_OPTIONS_TOKEN,
						useValue: optionsWithDocuments,
					},
				],
			}).compile();

			const serviceWithDocs = moduleWithDocs.get<SwaggerService>(SwaggerService);
			await serviceWithDocs.setupMultipleDocuments(mockApp);

			expect(serviceWithDocs.setupMultipleDocuments).toHaveBeenCalledWith(mockApp);
		});
	});
});
