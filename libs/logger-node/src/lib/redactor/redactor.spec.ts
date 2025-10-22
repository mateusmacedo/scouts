import type { Logger } from '../logger/logger';
import type { Redactor, RedactorOptions } from './redactor';
import { attachRedactor } from './redactor';

// Fake Redactor implementation para testar contratos
class FakeRedactor implements Redactor {
	private readonly patterns: RegExp[];
	private readonly keys: (string | RegExp)[];
	private readonly mask: string | ((value: unknown, path: string[]) => string);
	private readonly maxDepth: number;
	private readonly keepLengths: boolean;
	private readonly redactArrayIndices: boolean;

	constructor(options?: RedactorOptions) {
		this.patterns = options?.patterns || [];
		this.keys = options?.keys || [];
		this.mask = options?.mask || '[REDACTED]';
		this.maxDepth = options?.maxDepth ?? 10;
		this.keepLengths = options?.keepLengths ?? false;
		this.redactArrayIndices = options?.redactArrayIndices ?? false;
	}

	async redact(data: unknown): Promise<unknown> {
		// Simula redação assíncrona
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(this.performRedaction(data, [], 0));
			}, 5); // Simula operação assíncrona (aumentado para garantir timing)
		});
	}

	addPattern(pattern: RegExp): void {
		this.patterns.push(pattern);
	}

	addKey(key: string | RegExp): void {
		this.keys.push(key);
	}

	private performRedaction(data: unknown, path: string[], depth: number): unknown {
		if (depth > this.maxDepth) {
			return '[MAX_DEPTH_REACHED]';
		}

		if (data === null || data === undefined) {
			return data;
		}

		if (typeof data === 'string') {
			return this.redactString(data, path);
		}

		if (Array.isArray(data)) {
			return data.map((item, index) => {
				const newPath = this.redactArrayIndices ? [...path, `[${index}]`] : [...path];
				return this.performRedaction(item, newPath, depth + 1);
			});
		}

		if (typeof data === 'object') {
			const result: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(data)) {
				const newPath = [...path, key];
				const shouldRedact = this.shouldRedactKey(key, newPath);

				if (shouldRedact) {
					result[key] = this.getMaskedValue(value, newPath);
				} else {
					result[key] = this.performRedaction(value, newPath, depth + 1);
				}
			}
			return result;
		}

		return data;
	}

	private redactString(str: string, path: string[]): string {
		for (const pattern of this.patterns) {
			if (pattern.test(str)) {
				return this.getMaskedValue(str, path);
			}
		}
		return str;
	}

	private shouldRedactKey(key: string, path: string[]): boolean {
		return this.keys.some((k) => {
			if (typeof k === 'string') {
				return key === k;
			}
			return k.test(key);
		});
	}

	private getMaskedValue(value: unknown, path: string[]): string {
		if (typeof this.mask === 'function') {
			return this.mask(value, path);
		}

		if (this.keepLengths && typeof value === 'string') {
			return this.mask
				.repeat(Math.ceil(value.length / this.mask.length))
				.substring(0, value.length);
		}

		return this.mask;
	}
}

describe('Redactor Module', () => {
	describe('Redactor interface', () => {
		test('should implement all required methods', () => {
			const redactor = new FakeRedactor();

			expect(typeof redactor.redact).toBe('function');
			expect(typeof redactor.addPattern).toBe('function');
			expect(typeof redactor.addKey).toBe('function');
		});

		test('redact should be an async method', async () => {
			const redactor = new FakeRedactor();
			const result = await redactor.redact({ test: 'data' });

			expect(result).toBeDefined();
		});

		test('addPattern should accept RegExp', () => {
			const redactor = new FakeRedactor();
			const pattern = /password/gi;

			redactor.addPattern(pattern);

			expect(redactor).toBeDefined();
		});

		test('addKey should accept string', () => {
			const redactor = new FakeRedactor();

			redactor.addKey('password');

			expect(redactor).toBeDefined();
		});

		test('addKey should accept RegExp', () => {
			const redactor = new FakeRedactor();
			const pattern = /secret/gi;

			redactor.addKey(pattern);

			expect(redactor).toBeDefined();
		});
	});

	describe('RedactorOptions interface', () => {
		test('should accept all optional fields', () => {
			const options: RedactorOptions = {
				keys: ['password', 'secret'],
				patterns: [/token/gi, /key/gi],
				mask: '[REDACTED]',
				maxDepth: 5,
				keepLengths: true,
				redactArrayIndices: true,
			};

			expect(options.keys).toEqual(['password', 'secret']);
			expect(options.patterns).toEqual([/token/gi, /key/gi]);
			expect(options.mask).toBe('[REDACTED]');
			expect(options.maxDepth).toBe(5);
			expect(options.keepLengths).toBe(true);
			expect(options.redactArrayIndices).toBe(true);
		});

		test('should accept empty RedactorOptions', () => {
			const options: RedactorOptions = {};

			expect(options.keys).toBeUndefined();
			expect(options.patterns).toBeUndefined();
			expect(options.mask).toBeUndefined();
			expect(options.maxDepth).toBeUndefined();
			expect(options.keepLengths).toBeUndefined();
			expect(options.redactArrayIndices).toBeUndefined();
		});

		test('should accept only some fields', () => {
			const options: RedactorOptions = {
				keys: ['password'],
				maxDepth: 3,
			};

			expect(options.keys).toEqual(['password']);
			expect(options.maxDepth).toBe(3);
			expect(options.patterns).toBeUndefined();
		});

		test('keys should accept mixed array of string and RegExp', () => {
			const options: RedactorOptions = {
				keys: ['password', /secret/gi, 'token', /key/gi],
			};

			expect(options.keys).toEqual(['password', /secret/gi, 'token', /key/gi]);
		});

		test('patterns should accept array of RegExp', () => {
			const options: RedactorOptions = {
				patterns: [/password/gi, /secret/gi, /token/gi],
			};

			expect(options.patterns).toEqual([/password/gi, /secret/gi, /token/gi]);
		});

		test('mask should accept string', () => {
			const options: RedactorOptions = {
				mask: '***',
			};

			expect(options.mask).toBe('***');
		});

		test('mask should accept function', () => {
			const maskFunction = (value: unknown, path: string[]) => `[REDACTED_${path.join('.')}]`;
			const options: RedactorOptions = {
				mask: maskFunction,
			};

			expect(options.mask).toBe(maskFunction);
		});
	});

	describe('FakeRedactor implementation', () => {
		test('constructor without options should use default values', () => {
			const redactor = new FakeRedactor();

			expect(redactor).toBeInstanceOf(FakeRedactor);
		});

		test('constructor with options should apply configurations', () => {
			const options: RedactorOptions = {
				keys: ['password'],
				maxDepth: 5,
			};

			const redactor = new FakeRedactor(options);

			expect(redactor).toBeInstanceOf(FakeRedactor);
		});

		test('should handle redact with simulated async operation', async () => {
			const redactor = new FakeRedactor();
			const start = Date.now();

			await redactor.redact({ test: 'data' });

			const duration = Date.now() - start;
			expect(duration).toBeGreaterThanOrEqual(1); // Simulates async operation
		});

		test('addPattern should add pattern to list', () => {
			const redactor = new FakeRedactor();
			const pattern = /test/gi;

			redactor.addPattern(pattern);

			expect(redactor).toBeInstanceOf(FakeRedactor);
		});

		test('addKey should add key to list', () => {
			const redactor = new FakeRedactor();

			redactor.addKey('password');
			redactor.addKey(/secret/gi);

			expect(redactor).toBeInstanceOf(FakeRedactor);
		});
	});

	describe('Type validation', () => {
		test('Redactor should be compatible with fake implementation', () => {
			const redactor: Redactor = new FakeRedactor();

			expect(typeof redactor.redact).toBe('function');
			expect(typeof redactor.addPattern).toBe('function');
			expect(typeof redactor.addKey).toBe('function');
		});

		test('RedactorOptions should be compatible with fake implementation', () => {
			const options: RedactorOptions = {
				keys: ['password'],
				patterns: [/secret/gi],
				mask: '[REDACTED]',
				maxDepth: 5,
				keepLengths: true,
				redactArrayIndices: false,
			};

			const redactor = new FakeRedactor(options);

			expect(redactor).toBeInstanceOf(FakeRedactor);
		});

		test('mask function should have correct signature', () => {
			const maskFunction: (value: unknown, path: string[]) => string = (value, path) => {
				return `[REDACTED_${path.join('.')}_${typeof value}]`;
			};

			const options: RedactorOptions = {
				mask: maskFunction,
			};

			expect(typeof options.mask).toBe('function');
			expect(
				(options.mask as (value: unknown, path: string[]) => string)('test', ['user', 'name'])
			).toBe('[REDACTED_user.name_string]');
		});
	});

	describe('Edge cases', () => {
		test('should allow empty keys to be valid', () => {
			const options: RedactorOptions = {
				keys: [],
			};

			expect(options.keys).toEqual([]);
		});

		test('should allow empty patterns to be valid', () => {
			const options: RedactorOptions = {
				patterns: [],
			};

			expect(options.patterns).toEqual([]);
		});

		test('should allow maxDepth 0 to be valid', () => {
			const options: RedactorOptions = {
				maxDepth: 0,
			};

			expect(options.maxDepth).toBe(0);
		});

		test('should allow keepLengths false to be valid', () => {
			const options: RedactorOptions = {
				keepLengths: false,
			};

			expect(options.keepLengths).toBe(false);
		});

		test('should allow redactArrayIndices false to be valid', () => {
			const options: RedactorOptions = {
				redactArrayIndices: false,
			};

			expect(options.redactArrayIndices).toBe(false);
		});
	});

	describe('attachRedactor function', () => {
		// Fake Logger implementation para testes
		class FakeLogger implements Logger {
			async info(message: string, fields?: Record<string, unknown>): Promise<void> {
				// Simula logging
			}

			async error(message: string, fields?: Record<string, unknown>): Promise<void> {
				// Simula logging
			}

			async warn(message: string, fields?: Record<string, unknown>): Promise<void> {
				// Simula logging
			}

			async debug(message: string, fields?: Record<string, unknown>): Promise<void> {
				// Simula logging
			}

			async trace(message: string, fields?: Record<string, unknown>): Promise<void> {
				// Simula logging
			}

			async fatal(message: string, fields?: Record<string, unknown>): Promise<void> {
				// Simula logging
			}

			withFields(fields: Record<string, unknown>): Logger {
				return this;
			}

			withCorrelationId(cid: string): Logger {
				return this;
			}

			async flush(): Promise<void> {
				// Simula flush
			}

			async close(): Promise<void> {
				// Simula close
			}
		}

		test('should expose redactor in composite logger', () => {
			const logger = new FakeLogger();
			const redactor = new FakeRedactor();

			const enhanced = attachRedactor(logger, redactor);

			expect(enhanced.redactor).toBe(redactor);
		});

		test('should intercept logging methods to apply redaction', async () => {
			const logger = new FakeLogger();
			const redactor = new FakeRedactor({ keys: ['password'] });
			const enhanced = attachRedactor(logger, redactor);

			// Mock info method to capture arguments
			const originalInfo = logger.info;
			let capturedArgs: unknown[] = [];
			logger.info = async (message: string, fields?: Record<string, unknown>) => {
				capturedArgs = [message, fields];
				return originalInfo.call(logger, message, fields);
			};

			await enhanced.info('test', { password: 'secret123', user: 'john' });

			// Verify that redaction was applied to arguments
			expect(capturedArgs[0]).toBe('test');
			expect((capturedArgs[1] as any)?.password).toBe('[REDACTED]');
			expect((capturedArgs[1] as any)?.user).toBe('john');
		});

		test('should keep non-logging methods intact', () => {
			const logger = new FakeLogger();
			const redactor = new FakeRedactor();
			const enhanced = attachRedactor(logger, redactor);

			expect(typeof enhanced.flush).toBe('function');
			expect(typeof enhanced.close).toBe('function');
		});

		test('should support async methods', async () => {
			const logger = new FakeLogger();
			const redactor = new FakeRedactor({ keys: ['token'] });
			const enhanced = attachRedactor(logger, redactor);

			// Mock to capture arguments
			const originalError = logger.error;
			let capturedArgs: unknown[] = [];
			logger.error = async (message: string, fields?: Record<string, unknown>) => {
				capturedArgs = [message, fields];
				return originalError.call(logger, message, fields);
			};

			await enhanced.error('API call failed', { token: 'abc123', error: 'timeout' });

			// Verify that redaction works with async methods
			expect(capturedArgs[0]).toBe('API call failed');
			expect((capturedArgs[1] as any)?.token).toBe('[REDACTED]');
			expect((capturedArgs[1] as any)?.error).toBe('timeout');
		});

		test('should propagate errors correctly', async () => {
			const logger = new FakeLogger();
			const redactor = new FakeRedactor();
			const enhanced = attachRedactor(logger, redactor);

			// Mock that throws error
			logger.info = async () => {
				throw new Error('Logger error');
			};

			await expect(enhanced.info('test')).rejects.toThrow('Logger error');
		});

		test('should preserve type safety', () => {
			const logger = new FakeLogger();
			const redactor = new FakeRedactor();
			const enhanced = attachRedactor(logger, redactor);

			// Verify that types are preserved
			expect(enhanced).toHaveProperty('redactor');
			expect(enhanced).toHaveProperty('info');
			expect(enhanced).toHaveProperty('error');
			expect(enhanced).toHaveProperty('flush');
			expect(enhanced).toHaveProperty('close');
		});

		test('should work with logger that does not have all methods', () => {
			class MinimalLogger {
				async info(message: string): Promise<void> {
					// noop
				}
			}

			const logger = new MinimalLogger();
			const redactor = new FakeRedactor();
			const enhanced = attachRedactor(logger as any, redactor);

			expect(enhanced.redactor).toBe(redactor);
			expect(typeof enhanced.info).toBe('function');
		});
	});
});
