import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from './logger.module';
import { NestLoggerService } from './nest-logger.service';
import { LOGGER_TOKEN } from './constants';

describe('LoggerModule', () => {
	describe('forRoot', () => {
		it('should create module with default options', async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [LoggerModule.forRoot()],
			}).compile();

			const loggerService = module.get<NestLoggerService>(NestLoggerService);
			const logger = module.get(LOGGER_TOKEN);

			expect(loggerService).toBeDefined();
			expect(logger).toBeDefined();
		});

		it('should create module with custom options', async () => {
			const options = {
				service: 'test-service',
				environment: 'test',
				version: '2.0.0',
				enableMetrics: true,
				redactKeys: ['customKey'],
			};

			const module: TestingModule = await Test.createTestingModule({
				imports: [LoggerModule.forRoot(options)],
			}).compile();

			const loggerService = module.get<NestLoggerService>(NestLoggerService);
			const logger = module.get(LOGGER_TOKEN);

			expect(loggerService).toBeDefined();
			expect(logger).toBeDefined();
		});
	});

	describe('forRootAsync', () => {
		it('should create module with async options', async () => {
			const asyncOptions = {
				useFactory: () => ({
					service: 'async-service',
					environment: 'test',
					version: '1.0.0',
				}),
			};

			const module: TestingModule = await Test.createTestingModule({
				imports: [LoggerModule.forRootAsync(asyncOptions)],
			}).compile();

			const loggerService = module.get<NestLoggerService>(NestLoggerService);
			const logger = module.get(LOGGER_TOKEN);

			expect(loggerService).toBeDefined();
			expect(logger).toBeDefined();
		});
	});
});
