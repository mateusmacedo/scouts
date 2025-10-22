import { Log, LogDebug, LogError, LogInfo, LogWarn } from './log.decorator';
import type { LogEntry } from '../logger/logger';
import type { Sink } from '../sink/sink';
import type { Redactor } from '../redactor/redactor';

// Mock reflect-metadata
jest.mock('reflect-metadata', () => ({}));

// Mock Reflect global
Object.defineProperty(globalThis, 'Reflect', {
	value: {
		getOwnMetadataKeys: jest.fn(() => []),
		getOwnMetadata: jest.fn(),
		defineMetadata: jest.fn(),
	},
	writable: true,
});

// Mock das dependências
const mockSinkWrite = jest.fn();
const mockRedactorRedact = jest.fn();

const mockSink: Sink = {
	write: mockSinkWrite,
	flush: jest.fn(),
	close: jest.fn(),
};

const mockRedactor: Redactor = {
	redact: mockRedactorRedact,
	addPattern: jest.fn(),
	addKey: jest.fn(),
};

// Mock crypto.randomBytes
jest.mock('node:crypto', () => ({
	randomBytes: jest.fn(() => Buffer.from([0, 0, 0, 0])), // Sempre retorna 0 para sample rate
}));

// Mock context
jest.mock('../context/context', () => ({
	getCid: jest.fn(() => 'test-correlation-id'),
}));

// Mock pino
jest.mock('pino', () => {
	return jest.fn(() => ({
		info: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn(),
		trace: jest.fn(),
		fatal: jest.fn(),
	}));
});

// Mock performance.now
const mockPerformanceNow = jest.fn();
Object.defineProperty(globalThis, 'performance', {
	value: {
		now: mockPerformanceNow,
	},
	writable: true,
});

describe('Log Decorator', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPerformanceNow.mockReturnValue(1000);
		mockRedactorRedact.mockImplementation((data) => Promise.resolve(data));
	});

	describe('@Log decorator - functional logging', () => {
		it('should execute logging for synchronous methods', async () => {
			class TestClass {
				@Log({ sink: mockSink, redact: mockRedactor })
				testMethod(value: number): number {
					return value * 2;
				}
			}

			const instance = new TestClass();
			const result = instance.testMethod(5);

			expect(result).toBe(10);
			expect(mockSinkWrite).toHaveBeenCalledTimes(1);

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.level).toBe('info');
			expect(logEntry.outcome).toBe('success');
			expect(logEntry.scope.methodName).toBe('testMethod');
			expect(logEntry.scope.className).toBe('TestClass');
			expect(logEntry.correlationId).toBe('test-correlation-id');
			expect(logEntry.durationMs).toBe(0); // performance.now mock
		});

		it('should execute logging for asynchronous methods', async () => {
			class TestClass {
				@Log({ sink: mockSink, redact: mockRedactor })
				async testMethod(value: number): Promise<number> {
					return value * 2;
				}
			}

			const instance = new TestClass();
			const result = await instance.testMethod(5);

			expect(result).toBe(10);
			expect(mockSinkWrite).toHaveBeenCalledTimes(1);

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.outcome).toBe('success');
		});

		it('should include arguments when configured', async () => {
			class TestClass {
				@Log({
					sink: mockSink,
					redact: mockRedactor,
					includeArgs: true,
				})
				testMethod(a: number, b: string): string {
					return `${a}-${b}`;
				}
			}

			const instance = new TestClass();
			instance.testMethod(42, 'test');

			expect(mockRedactorRedact).toHaveBeenCalledWith([42, 'test']);
			expect(mockSinkWrite).toHaveBeenCalledTimes(1);

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.args).toBeDefined();
		});

		it('should include result when configured', async () => {
			class TestClass {
				@Log({
					sink: mockSink,
					redact: mockRedactor,
					includeResult: true,
				})
				testMethod(value: number): number {
					return value * 2;
				}
			}

			const instance = new TestClass();
			instance.testMethod(5);

			expect(mockRedactorRedact).toHaveBeenCalledWith(10);
			expect(mockSinkWrite).toHaveBeenCalledTimes(1);

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.result).toBeDefined();
		});

		it('should handle errors and log failure', async () => {
			class TestClass {
				@Log({ sink: mockSink, redact: mockRedactor })
				testMethod(): never {
					throw new Error('Test error');
				}
			}

			const instance = new TestClass();

			expect(() => instance.testMethod()).toThrow('Test error');
			expect(mockSinkWrite).toHaveBeenCalledTimes(1);

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.outcome).toBe('failure');
			expect(logEntry.error).toBeDefined();
			expect(logEntry.error?.name).toBe('Error');
			expect(logEntry.error?.message).toBe('Test error');
		});

		it('should handle async errors', async () => {
			class TestClass {
				@Log({ sink: mockSink, redact: mockRedactor })
				async testMethod(): Promise<never> {
					throw new Error('Async error');
				}
			}

			const instance = new TestClass();

			await expect(instance.testMethod()).rejects.toThrow('Async error');
			expect(mockSinkWrite).toHaveBeenCalledTimes(1);

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.outcome).toBe('failure');
			expect(logEntry.error?.message).toBe('Async error');
		});

		it('should respect sample rate', async () => {
			// Mock randomBytes to return value that should be sampled
			const { randomBytes } = require('node:crypto');
			randomBytes.mockReturnValueOnce(Buffer.from([255, 255, 255, 255])); // Max value = 1.0

			class TestClass {
				@Log({
					sink: mockSink,
					redact: mockRedactor,
					sampleRate: 0.5,
				})
				testMethod(): string {
					return 'test';
				}
			}

			const instance = new TestClass();
			instance.testMethod();

			// Should not log due to sample rate
			expect(mockSinkWrite).not.toHaveBeenCalled();
		});

		it('should use custom log level', async () => {
			class TestClass {
				@Log({
					sink: mockSink,
					redact: mockRedactor,
					level: 'debug',
				})
				testMethod(): string {
					return 'test';
				}
			}

			const instance = new TestClass();
			instance.testMethod();

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.level).toBe('debug');
		});
	});

	describe('Convenience decorators', () => {
		it('should create LogInfo with info level', async () => {
			class TestClass {
				@LogInfo({ sink: mockSink, redact: mockRedactor })
				testMethod(): string {
					return 'info test';
				}
			}

			const instance = new TestClass();
			instance.testMethod();

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.level).toBe('info');
		});

		it('should create LogDebug with debug level', async () => {
			class TestClass {
				@LogDebug({ sink: mockSink, redact: mockRedactor })
				testMethod(): string {
					return 'debug test';
				}
			}

			const instance = new TestClass();
			instance.testMethod();

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.level).toBe('debug');
		});

		it('should create LogWarn with warn level', async () => {
			class TestClass {
				@LogWarn({ sink: mockSink, redact: mockRedactor })
				testMethod(): string {
					return 'warn test';
				}
			}

			const instance = new TestClass();
			instance.testMethod();

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.level).toBe('warn');
		});

		it('should create LogError with error level', async () => {
			class TestClass {
				@LogError({ sink: mockSink, redact: mockRedactor })
				testMethod(): string {
					return 'error test';
				}
			}

			const instance = new TestClass();
			instance.testMethod();

			const logEntry = mockSinkWrite.mock.calls[0][0] as LogEntry;
			expect(logEntry.level).toBe('error');
		});
	});

	describe('Integration scenarios', () => {
		it('should work with real class methods', async () => {
			class UserService {
				@Log({
					level: 'info',
					includeArgs: true,
					includeResult: true,
					sink: mockSink,
					redact: mockRedactor,
				})
				async createUser(userData: { name: string; email: string }) {
					return { id: 1, ...userData };
				}

				@LogInfo({ sink: mockSink, redact: mockRedactor })
				async findUser(id: string) {
					return { id, name: 'Test User' };
				}

				@LogDebug({ sink: mockSink, redact: mockRedactor })
				async updateUser(id: string, data: any) {
					return { id, ...data };
				}
			}

			const service = new UserService();

			await service.createUser({ name: 'John', email: 'john@example.com' });
			await service.findUser('123');
			await service.updateUser('123', { name: 'Jane' });

			expect(mockSinkWrite).toHaveBeenCalledTimes(3);
		});

		it('should preserve method behavior and execute logging', async () => {
			class TestClass {
				@Log({ sink: mockSink, redact: mockRedactor })
				testMethod(value: number): number {
					return value * 2;
				}
			}

			const instance = new TestClass();
			const result = instance.testMethod(5);

			expect(result).toBe(10);
			expect(mockSinkWrite).toHaveBeenCalledTimes(1);
		});

		it('should handle complex data structures with redaction', async () => {
			const sensitiveData = {
				user: 'john',
				password: 'secret123',
				email: 'john@example.com',
			};

			mockRedactorRedact.mockImplementation((data) =>
				Promise.resolve({ ...data, password: '***' })
			);

			class TestClass {
				@Log({
					sink: mockSink,
					redact: mockRedactor,
					includeArgs: true,
					includeResult: true,
				})
				processUser(data: any): any {
					return { ...data, processed: true };
				}
			}

			const instance = new TestClass();
			instance.processUser(sensitiveData);

			expect(mockRedactorRedact).toHaveBeenCalledTimes(2); // args + result
			expect(mockRedactorRedact).toHaveBeenNthCalledWith(1, [sensitiveData]); // args
			expect(mockRedactorRedact).toHaveBeenNthCalledWith(2, { ...sensitiveData, processed: true }); // result
			expect(mockSinkWrite).toHaveBeenCalledTimes(1);
		});
	});
});
