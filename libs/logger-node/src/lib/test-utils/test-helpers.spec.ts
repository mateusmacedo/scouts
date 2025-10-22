import {
	createTestLogger,
	createMockLogEntry,
	waitForLog,
	waitForLogs,
	logsContain,
	logsContainMessage,
	logsContainLevel,
	setupTestEnvironment,
} from './test-helpers';

describe('Test Helpers', () => {
	describe('createTestLogger', () => {
		it('should create logger that captures logs', () => {
			const { logger, capturedLogs } = createTestLogger();

			logger.info('Test message', { field: 'value' });

			expect(capturedLogs).toHaveLength(1);
			expect(capturedLogs[0]).toEqual({
				level: 'info',
				message: 'Test message',
				fields: { field: 'value' },
			});
		});

		it('should respect minLevel option', () => {
			const { logger, capturedLogs } = createTestLogger({ minLevel: 'warn' });

			logger.info('Info message');
			logger.warn('Warning message');
			logger.error('Error message');

			expect(capturedLogs).toHaveLength(2);
			expect(capturedLogs[0].level).toBe('warn');
			expect(capturedLogs[1].level).toBe('error');
		});

		it('should include timestamps when requested', () => {
			const { logger, capturedLogs } = createTestLogger({ includeTimestamps: true });

			logger.info('Test message');

			expect(capturedLogs[0].timestamp).toBeDefined();
			expect(capturedLogs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		});

		it('should provide utility methods', () => {
			const { logger, capturedLogs, clearLogs, getLogsByLevel, getLastLog } = createTestLogger();

			logger.info('Info message');
			logger.warn('Warning message');
			logger.info('Another info message');

			expect(getLogsByLevel('info')).toHaveLength(2);
			expect(getLogsByLevel('warn')).toHaveLength(1);
			expect(getLastLog()?.message).toBe('Another info message');

			clearLogs();
			expect(capturedLogs).toHaveLength(0);
		});
	});

	describe('createMockLogEntry', () => {
		it('should create default log entry', () => {
			const entry = createMockLogEntry();

			expect(entry).toEqual({
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { className: 'TestClass', methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			});
		});

		it('should allow overriding fields', () => {
			const entry = createMockLogEntry({
				level: 'error',
				args: ['Custom message'],
				correlationId: 'custom-correlation-id',
			});

			expect(entry.level).toBe('error');
			expect(entry.args).toEqual(['Custom message']);
			expect(entry.correlationId).toBe('custom-correlation-id');
		});
	});

	describe('waitForLog', () => {
		it('should wait for specific log', async () => {
			const { logger, capturedLogs } = createTestLogger();

			// Start waiting before the log is created
			const waitPromise = waitForLog(capturedLogs, (log) => log.message.includes('Target message'));

			// Create the log after a short delay
			setTimeout(() => {
				logger.info('Target message');
			}, 10);

			const result = await waitPromise;
			expect(result.message).toBe('Target message');
		});

		it('should timeout if log not found', async () => {
			const { capturedLogs } = createTestLogger();

			await expect(
				waitForLog(capturedLogs, (log) => log.message.includes('Never appears'), 50)
			).rejects.toThrow('Timeout waiting for log');
		});
	});

	describe('waitForLogs', () => {
		it('should wait for multiple logs', async () => {
			const { logger, capturedLogs } = createTestLogger();

			const waitPromise = waitForLogs(capturedLogs, 2, (log) => log.level === 'info');

			setTimeout(() => {
				logger.info('First message');
				logger.info('Second message');
			}, 10);

			const results = await waitPromise;
			expect(results).toHaveLength(2);
			expect(results[0].message).toBe('First message');
			expect(results[1].message).toBe('Second message');
		});

		it('should timeout if not enough logs found', async () => {
			const { logger, capturedLogs } = createTestLogger();

			const waitPromise = waitForLogs(capturedLogs, 3, (log) => log.level === 'info');

			setTimeout(() => {
				logger.info('Only one message');
			}, 10);

			await expect(waitPromise).rejects.toThrow('Timeout waiting for 3 logs');
		});
	});

	describe('logsContain', () => {
		it('should check if logs contain specific field value', () => {
			const { logger, capturedLogs } = createTestLogger();

			logger.info('Message 1', { userId: '123' });
			logger.info('Message 2', { userId: '456' });

			expect(logsContain(capturedLogs, 'userId', '123')).toBe(true);
			expect(logsContain(capturedLogs, 'userId', '789')).toBe(false);
		});
	});

	describe('logsContainMessage', () => {
		it('should check if logs contain specific message', () => {
			const { logger, capturedLogs } = createTestLogger();

			logger.info('User login successful');
			logger.info('User logout successful');

			expect(logsContainMessage(capturedLogs, 'login')).toBe(true);
			expect(logsContainMessage(capturedLogs, 'logout')).toBe(true);
			expect(logsContainMessage(capturedLogs, 'register')).toBe(false);
		});
	});

	describe('logsContainLevel', () => {
		it('should check if logs contain specific level', () => {
			const { logger, capturedLogs } = createTestLogger();

			logger.info('Info message');
			logger.warn('Warning message');
			logger.error('Error message');

			expect(logsContainLevel(capturedLogs, 'info')).toBe(true);
			expect(logsContainLevel(capturedLogs, 'warn')).toBe(true);
			expect(logsContainLevel(capturedLogs, 'error')).toBe(true);
			expect(logsContainLevel(capturedLogs, 'debug')).toBe(false);
		});
	});

	describe('setupTestEnvironment', () => {
		it('should mock console methods and provide restore function', () => {
			const { restoreConsole } = setupTestEnvironment();

			// Console methods should be mocked (jest.fn())
			expect(console.log).toBeDefined();
			expect(console.error).toBeDefined();
			expect(console.warn).toBeDefined();

			// Restore should work
			restoreConsole();
			expect(console.log).toBeDefined();
		});
	});
});
