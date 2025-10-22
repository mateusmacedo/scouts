import { Test, TestingModule } from '@nestjs/testing';
import type { Logger } from '@scouts/logger-node';
import { LOGGER_TOKEN } from './constants';
import { NestLoggerService } from './nest-logger.service';

describe('NestLoggerService', () => {
	let service: NestLoggerService;
	let mockLogger: jest.Mocked<Logger>;

	beforeEach(async () => {
		mockLogger = {
			info: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			debug: jest.fn(),
			fatal: jest.fn(),
		} as any;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NestLoggerService,
				{
					provide: LOGGER_TOKEN,
					useValue: mockLogger,
				},
			],
		}).compile();

		service = module.get<NestLoggerService>(NestLoggerService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('log', () => {
		it('should call logger.info with message and context', () => {
			service.log('test message', 'TestContext');
			expect(mockLogger.info).toHaveBeenCalledWith('test message', { context: 'TestContext' });
		});

		it('should call logger.info with message only when no context', () => {
			service.log('test message');
			expect(mockLogger.info).toHaveBeenCalledWith('test message', { context: undefined });
		});
	});

	describe('error', () => {
		it('should call logger.error with message, trace and context', () => {
			service.error('error message', 'stack trace', 'TestContext');
			expect(mockLogger.error).toHaveBeenCalledWith('error message', {
				trace: 'stack trace',
				context: 'TestContext',
			});
		});

		it('should call logger.error with message only when no trace or context', () => {
			service.error('error message');
			expect(mockLogger.error).toHaveBeenCalledWith('error message', {
				trace: undefined,
				context: undefined,
			});
		});
	});

	describe('warn', () => {
		it('should call logger.warn with message and context', () => {
			service.warn('warning message', 'TestContext');
			expect(mockLogger.warn).toHaveBeenCalledWith('warning message', { context: 'TestContext' });
		});
	});

	describe('debug', () => {
		it('should call logger.debug with message and context', () => {
			service.debug('debug message', 'TestContext');
			expect(mockLogger.debug).toHaveBeenCalledWith('debug message', { context: 'TestContext' });
		});
	});

	describe('verbose', () => {
		it('should call logger.debug with message and context', () => {
			service.verbose('verbose message', 'TestContext');
			expect(mockLogger.debug).toHaveBeenCalledWith('verbose message', { context: 'TestContext' });
		});
	});

	describe('fatal', () => {
		it('should call logger.fatal with message and context', () => {
			service.fatal('fatal message', 'TestContext');
			expect(mockLogger.fatal).toHaveBeenCalledWith('fatal message', { context: 'TestContext' });
		});
	});

	describe('getLogger', () => {
		it('should return the underlying logger instance', () => {
			const logger = service.getLogger();
			expect(logger).toBe(mockLogger);
		});
	});
});
