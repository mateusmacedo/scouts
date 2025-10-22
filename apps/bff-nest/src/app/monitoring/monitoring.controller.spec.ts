import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@scouts/utils-nest';
import { MonitoringController } from './monitoring.controller';
import { LoggerMetrics, MonitoringService } from './monitoring.service';

describe('MonitoringController', () => {
	let controller: MonitoringController;
	let service: MonitoringService;

	const mockLoggerMetrics: LoggerMetrics = {
		logsWritten: 150,
		errorCount: 3,
		uptimeMs: 3600000, // 1 hour
		memoryUsage: {
			rss: 52428800, // 50MB
			heapTotal: 20971520, // 20MB
			heapUsed: 15728640, // 15MB
			external: 0,
			arrayBuffers: 0,
		},
		timestamp: '2024-01-01T00:00:00.000Z',
	};

	const mockHealthStatus = {
		status: 'healthy',
		logger: {
			status: 'operational',
			metrics: mockLoggerMetrics,
		},
		timestamp: '2024-01-01T00:00:00.000Z',
	};

	const mockRedactionTestData = {
		original: {
			user: {
				name: 'John Doe',
				email: 'john@example.com',
				password: 'secret123',
				token: 'jwt-token-here',
				cardNumber: '4111-1111-1111-1111',
				ssn: '123-45-6789',
			},
			apiKey: 'sk-1234567890abcdef',
			secret: 'super-secret-key',
		},
		redacted: 'Check logs to see redacted output',
	};

	const mockMonitoringService = {
		getLoggerMetrics: jest.fn(),
		testRedaction: jest.fn(),
		getHealthStatus: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule.forRoot()],
			controllers: [MonitoringController],
			providers: [
				{
					provide: MonitoringService,
					useValue: mockMonitoringService,
				},
			],
		}).compile();

		controller = module.get<MonitoringController>(MonitoringController);
		service = module.get<MonitoringService>(MonitoringService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getMetrics', () => {
		it('should return logger metrics', async () => {
			mockMonitoringService.getLoggerMetrics.mockResolvedValue(mockLoggerMetrics);

			const result = await controller.getMetrics();

			expect(service.getLoggerMetrics).toHaveBeenCalled();
			expect(result).toEqual(mockLoggerMetrics);
		});

		it('should handle empty metrics', async () => {
			const emptyMetrics: LoggerMetrics = {
				logsWritten: 0,
				errorCount: 0,
				uptimeMs: 0,
				memoryUsage: {
					rss: 0,
					heapTotal: 0,
					heapUsed: 0,
					external: 0,
					arrayBuffers: 0,
				},
				timestamp: '2024-01-01T00:00:00.000Z',
			};

			mockMonitoringService.getLoggerMetrics.mockResolvedValue(emptyMetrics);

			const result = await controller.getMetrics();

			expect(result).toEqual(emptyMetrics);
		});
	});

	describe('testRedaction', () => {
		it('should test data redaction', async () => {
			mockMonitoringService.testRedaction.mockResolvedValue(mockRedactionTestData);

			const result = await controller.testRedaction();

			expect(service.testRedaction).toHaveBeenCalled();
			expect(result).toEqual(mockRedactionTestData);
		});

		it('should handle redaction test with different data', async () => {
			const customRedactionData = {
				original: {
					user: {
						name: 'Jane Doe',
						email: 'jane@example.com',
						password: 'different123',
						token: 'different-token',
						cardNumber: '5555-5555-5555-5555',
						ssn: '987-65-4321',
					},
					apiKey: 'different-api-key',
					secret: 'different-secret',
				},
				redacted: 'Check logs to see redacted output',
			};

			mockMonitoringService.testRedaction.mockResolvedValue(customRedactionData);

			const result = await controller.testRedaction();

			expect(result).toEqual(customRedactionData);
		});
	});

	describe('getHealth', () => {
		it('should return health status', async () => {
			mockMonitoringService.getHealthStatus.mockResolvedValue(mockHealthStatus);

			const result = await controller.getHealth();

			expect(service.getHealthStatus).toHaveBeenCalled();
			expect(result).toEqual(mockHealthStatus);
		});

		it('should return healthy status', async () => {
			mockMonitoringService.getHealthStatus.mockResolvedValue(mockHealthStatus);

			const result = await controller.getHealth();

			expect(result.status).toBe('healthy');
			expect(result.logger.status).toBe('operational');
		});
	});


	describe('getLoggerStats', () => {
		it('should return formatted logger statistics', () => {
			mockMonitoringService.getLoggerMetrics.mockReturnValue(mockLoggerMetrics);

			const result = controller.getLoggerStats();

			expect(service.getLoggerMetrics).toHaveBeenCalled();
			expect(result).toEqual({
				summary: {
					totalLogs: 150,
					errors: 3,
					uptime: '3600s',
					memoryUsage: {
						rss: '50MB',
						heapTotal: '20MB',
						heapUsed: '15MB',
					},
				},
				details: mockLoggerMetrics,
			});
		});

		it('should format memory usage correctly', () => {
			const customMetrics: LoggerMetrics = {
				logsWritten: 1000,
				errorCount: 0,
				uptimeMs: 7200000, // 2 hours
				memoryUsage: {
					rss: 104857600, // 100MB
					heapTotal: 52428800, // 50MB
					heapUsed: 31457280, // 30MB
					external: 0,
					arrayBuffers: 0,
				},
				timestamp: '2024-01-01T00:00:00.000Z',
			};

			mockMonitoringService.getLoggerMetrics.mockReturnValue(customMetrics);

			const result = controller.getLoggerStats();

			expect(result.summary.memoryUsage).toEqual({
				rss: '100MB',
				heapTotal: '50MB',
				heapUsed: '30MB',
			});
			expect(result.summary.uptime).toBe('7200s');
		});

		it('should handle zero values', () => {
			const zeroMetrics: LoggerMetrics = {
				logsWritten: 0,
				errorCount: 0,
				uptimeMs: 0,
				memoryUsage: {
					rss: 0,
					heapTotal: 0,
					heapUsed: 0,
					external: 0,
					arrayBuffers: 0,
				},
				timestamp: '2024-01-01T00:00:00.000Z',
			};

			mockMonitoringService.getLoggerMetrics.mockReturnValue(zeroMetrics);

			const result = controller.getLoggerStats();

			expect(result.summary).toEqual({
				totalLogs: 0,
				errors: 0,
				uptime: '0s',
				memoryUsage: {
					rss: '0MB',
					heapTotal: '0MB',
					heapUsed: '0MB',
				},
			});
		});
	});
});
