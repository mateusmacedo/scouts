import { LOGGER_TOKEN, LoggerModule } from '@scouts/utils-nest';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerMetrics, MonitoringService } from './monitoring.service';

describe('MonitoringService', () => {
	let service: MonitoringService;
	let logger: any;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule.forRoot()],
			providers: [MonitoringService],
		}).compile();

		service = module.get<MonitoringService>(MonitoringService);
		logger = module.get(LOGGER_TOKEN);

		// Mock the logger methods
		jest.spyOn(logger, 'info');
		jest.spyOn(logger, 'error');
		jest.spyOn(logger, 'warn');
		jest.spyOn(logger, 'debug');
		jest.spyOn(logger, 'fatal');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getLoggerMetrics', () => {
		it('should return metrics when logger has getMetrics method', async () => {
			const mockMetrics = {
				logsWritten: 150,
				errorCount: 3,
				uptimeMs: 3600000,
			};

			logger.getMetrics = jest.fn().mockReturnValue(mockMetrics);

			const result = await service.getLoggerMetrics();

			expect(logger.getMetrics).toHaveBeenCalled();
			expect(result).toEqual({
				logsWritten: 150,
				errorCount: 3,
				uptimeMs: 3600000,
				memoryUsage: expect.any(Object),
				timestamp: expect.any(String),
			});

			expect(result.memoryUsage).toHaveProperty('rss');
			expect(result.memoryUsage).toHaveProperty('heapTotal');
			expect(result.memoryUsage).toHaveProperty('heapUsed');
			expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		});

		it('should return default values when logger has no getMetrics method', async () => {
			// Remove getMetrics method to simulate logger without metrics
			logger.getMetrics = undefined;

			const result = await service.getLoggerMetrics();

			expect(result).toEqual({
				logsWritten: 0,
				errorCount: 0,
				uptimeMs: 0,
				memoryUsage: expect.any(Object),
				timestamp: expect.any(String),
			});
		});

		it('should handle getMetrics returning undefined', async () => {
			logger.getMetrics = jest.fn().mockReturnValue(undefined);

			const result = await service.getLoggerMetrics();

			expect(result).toEqual({
				logsWritten: 0,
				errorCount: 0,
				uptimeMs: 0,
				memoryUsage: expect.any(Object),
				timestamp: expect.any(String),
			});
		});

		it('should handle getMetrics returning partial data', async () => {
			const partialMetrics = {
				logsWritten: 50,
				// errorCount and uptimeMs missing
			};

			logger.getMetrics = jest.fn().mockReturnValue(partialMetrics);

			const result = await service.getLoggerMetrics();

			expect(result).toEqual({
				logsWritten: 50,
				errorCount: 0,
				uptimeMs: 0,
				memoryUsage: expect.any(Object),
				timestamp: expect.any(String),
			});
		});

		it('should include process memory usage', async () => {
			const result = await service.getLoggerMetrics();

			expect(result.memoryUsage).toHaveProperty('rss');
			expect(result.memoryUsage).toHaveProperty('heapTotal');
			expect(result.memoryUsage).toHaveProperty('heapUsed');
			expect(result.memoryUsage).toHaveProperty('external');
			expect(result.memoryUsage).toHaveProperty('arrayBuffers');
		});
	});

	describe('testRedaction', () => {
		it('should test data redaction with sensitive data', async () => {
			const result = await service.testRedaction();

			expect(result).toEqual({
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
			});

			expect(logger.info).toHaveBeenCalledWith('Testing redaction with sensitive data', {
				testData: result.original,
			});
		});

		it('should log sensitive data for redaction testing', async () => {
			await service.testRedaction();

			expect(logger.info).toHaveBeenCalledWith(
				'Testing redaction with sensitive data',
				expect.objectContaining({
					testData: expect.objectContaining({
						user: expect.objectContaining({
							password: 'secret123',
							token: 'jwt-token-here',
							cardNumber: '4111-1111-1111-1111',
							ssn: '123-45-6789',
						}),
						apiKey: 'sk-1234567890abcdef',
						secret: 'super-secret-key',
					}),
				})
			);
		});

		it('should return consistent test data structure', async () => {
			const result1 = await service.testRedaction();
			const result2 = await service.testRedaction();

			expect(result1.original).toEqual(result2.original);
			expect(result1.redacted).toEqual(result2.redacted);
		});
	});

	describe('getHealthStatus', () => {
		it('should return healthy status with logger metrics', async () => {
			const _mockMetrics: LoggerMetrics = {
				logsWritten: 100,
				errorCount: 0,
				uptimeMs: 1800000,
				memoryUsage: {
					rss: 52428800,
					heapTotal: 20971520,
					heapUsed: 15728640,
					external: 0,
					arrayBuffers: 0,
				},
				timestamp: '2024-01-01T00:00:00.000Z',
			};

			logger.getMetrics = jest.fn().mockReturnValue({
				logsWritten: 100,
				errorCount: 0,
				uptimeMs: 1800000,
			});

			const result = await service.getHealthStatus();

			expect(result).toEqual({
				status: 'healthy',
				logger: {
					status: 'operational',
					metrics: expect.objectContaining({
						logsWritten: 100,
						errorCount: 0,
						uptimeMs: 1800000,
						memoryUsage: expect.any(Object),
						timestamp: expect.any(String),
					}),
				},
				timestamp: expect.any(String),
			});
		});

		it('should return healthy status even with errors', async () => {
			logger.getMetrics = jest.fn().mockReturnValue({
				logsWritten: 100,
				errorCount: 5,
				uptimeMs: 3600000,
			});

			const result = await service.getHealthStatus();

			expect(result.status).toBe('healthy');
			expect(result.logger.status).toBe('operational');
			expect(result.logger.metrics.errorCount).toBe(5);
		});

		it('should include current timestamp', async () => {
			const beforeCall = new Date();
			const result = await service.getHealthStatus();
			const afterCall = new Date();

			const resultTimestamp = new Date(result.timestamp);
			expect(resultTimestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
			expect(resultTimestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
		});

		it('should call getLoggerMetrics internally', async () => {
			const getLoggerMetricsSpy = jest.spyOn(service, 'getLoggerMetrics');

			await service.getHealthStatus();

			expect(getLoggerMetricsSpy).toHaveBeenCalled();
		});
	});

	describe('logger integration', () => {
		it('should have logger injected', () => {
			expect(service['logger']).toBeDefined();
			expect(service['nodeLogger']).toBeDefined();
		});

		it('should use both NestLoggerService and node logger', async () => {
			const logSpy = jest.spyOn(service['logger'], 'log');
			const infoSpy = jest.spyOn(logger, 'info');

			await service.testRedaction();

			expect(logSpy).toHaveBeenCalledWith('Testing data redaction', 'MonitoringService');
			expect(infoSpy).toHaveBeenCalled();
		});
	});
});
