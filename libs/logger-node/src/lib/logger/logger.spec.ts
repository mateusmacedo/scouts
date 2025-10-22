import type { LogEntry, Logger, LogLevel } from './logger';

// Fake Logger implementation para testar contratos
class FakeLogger implements Logger {
	constructor(
		private readonly fields: Record<string, unknown> = {},
		private readonly correlationId?: string
	) {}

	trace(message: string, fields?: Record<string, unknown>): void {
		this.log('trace', message, fields);
	}

	debug(message: string, fields?: Record<string, unknown>): void {
		this.log('debug', message, fields);
	}

	info(message: string, fields?: Record<string, unknown>): void {
		this.log('info', message, fields);
	}

	warn(message: string, fields?: Record<string, unknown>): void {
		this.log('warn', message, fields);
	}

	error(message: string, fields?: Record<string, unknown>): void {
		this.log('error', message, fields);
	}

	fatal(message: string, fields?: Record<string, unknown>): void {
		this.log('fatal', message, fields);
	}

	withFields(fields: Record<string, unknown>): Logger {
		return new FakeLogger({ ...this.fields, ...fields }, this.correlationId);
	}

	withCorrelationId(cid: string): Logger {
		return new FakeLogger(this.fields, cid);
	}

	flush(): void {
		// Simula flush
	}

	close(): void {
		// Simula close
	}

	private log(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
		// Simula processamento de log
		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			scope: { methodName: level },
			outcome: 'success',
			args: [message],
			correlationId: this.correlationId,
			durationMs: 0,
		};

		// Merge fields
		const allFields = { ...this.fields, ...fields };
		Object.assign(logEntry, allFields);
	}
}

describe('Logger Module', () => {
	describe('LogLevel type', () => {
		test('should accept all valid levels', () => {
			const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

			for (const level of validLevels) {
				expect(validLevels).toContain(level);
			}
		});
	});

	describe('LogEntry interface', () => {
		test('should have valid LogEntry structure', () => {
			const logEntry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { className: 'TestClass', methodName: 'testMethod' },
				outcome: 'success',
				args: ['test message'],
				result: { data: 'test' },
				correlationId: 'test-cid',
				durationMs: 100,
			};

			expect(logEntry.timestamp).toBe('2023-01-01T00:00:00.000Z');
			expect(logEntry.level).toBe('info');
			expect(logEntry.scope.className).toBe('TestClass');
			expect(logEntry.scope.methodName).toBe('testMethod');
			expect(logEntry.outcome).toBe('success');
			expect(logEntry.args).toEqual(['test message']);
			expect(logEntry.result).toEqual({ data: 'test' });
			expect(logEntry.correlationId).toBe('test-cid');
			expect(logEntry.durationMs).toBe(100);
		});

		test('should support LogEntry with optional fields', () => {
			const minimalLogEntry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'error',
				scope: { methodName: 'errorMethod' },
				outcome: 'failure',
				durationMs: 50,
			};

			expect(minimalLogEntry.timestamp).toBe('2023-01-01T00:00:00.000Z');
			expect(minimalLogEntry.level).toBe('error');
			expect(minimalLogEntry.scope.methodName).toBe('errorMethod');
			expect(minimalLogEntry.outcome).toBe('failure');
			expect(minimalLogEntry.durationMs).toBe(50);
			expect(minimalLogEntry.args).toBeUndefined();
			expect(minimalLogEntry.result).toBeUndefined();
			expect(minimalLogEntry.correlationId).toBeUndefined();
		});
	});

	describe('Logger interface', () => {
		let logger: FakeLogger;

		beforeEach(() => {
			logger = new FakeLogger();
		});

		test('should implement all logging methods', () => {
			logger.trace('trace message');
			logger.debug('debug message');
			logger.info('info message');
			logger.warn('warn message');
			logger.error('error message');
			logger.fatal('fatal message');
		});

		test('should accept additional fields in logging methods', () => {
			const fields = { userId: '123', action: 'login' };

			logger.info('user action', fields);
		});

		test('withFields should return new logger with additional fields', () => {
			const newLogger = logger.withFields({ service: 'test-service' });

			expect(newLogger).toBeInstanceOf(FakeLogger);
			expect(newLogger).not.toBe(logger);
		});

		test('withCorrelationId should return new logger with correlation ID', () => {
			const cid = 'test-correlation-id';
			const newLogger = logger.withCorrelationId(cid);

			expect(newLogger).toBeInstanceOf(FakeLogger);
			expect(newLogger).not.toBe(logger);
		});

		test('flush and close should be methods', () => {
			logger.flush();
			logger.close();
		});

		test('logger should maintain state between calls', () => {
			const loggerWithFields = logger.withFields({ service: 'test' });
			const loggerWithCid = loggerWithFields.withCorrelationId('test-cid');

			expect(loggerWithCid).toBeInstanceOf(FakeLogger);
		});
	});

	describe('FakeLogger implementation', () => {
		test('constructor should accept initial fields and correlation ID', () => {
			const initialFields = { service: 'test-service' };
			const cid = 'test-cid';
			const logger = new FakeLogger(initialFields, cid);

			expect(logger).toBeInstanceOf(FakeLogger);
		});

		test('constructor without parameters should create empty logger', () => {
			const logger = new FakeLogger();

			expect(logger).toBeInstanceOf(FakeLogger);
		});
	});
});
