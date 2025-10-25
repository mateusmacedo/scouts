import type { LogEntry, Logger } from '../logger/logger';
import type { Sink, SinkOptions } from './sink';

// attachSink foi removido na refatoração

// Fake Sink implementation para testar contratos
class FakeSink implements Sink {
	private entries: LogEntry[] = [];
	private closed: boolean = false;
	private service?: string;
	private environment?: string;
	private version?: string;
	private fields?: Record<string, unknown>;

	constructor(options?: SinkOptions) {
		this.service = options?.service;
		this.environment = options?.environment;
		this.version = options?.version;
		this.fields = options?.fields;
	}

	async write(entry: LogEntry): Promise<void> {
		if (this.closed) {
			throw new Error('Sink is closed');
		}

		// Simula processamento assíncrono
		await new Promise((resolve) => setTimeout(resolve, 1));

		// Adiciona campos do sink à entrada
		const enrichedEntry = {
			...entry,
			...(this.service && { service: this.service }),
			...(this.environment && { environment: this.environment }),
			...(this.version && { version: this.version }),
			...(this.fields && { ...this.fields }),
		};

		this.entries.push(enrichedEntry);
	}

	async flush(): Promise<void> {
		if (this.closed) {
			throw new Error('Sink is closed');
		}

		// Simula flush assíncrono
		await new Promise((resolve) => setTimeout(resolve, 1));
	}

	async close(): Promise<void> {
		if (this.closed) {
			return;
		}

		// Simula close assíncrono
		await new Promise((resolve) => setTimeout(resolve, 1));
		this.closed = true;
	}

	// Métodos auxiliares para testes
	getEntries(): LogEntry[] {
		return [...this.entries];
	}

	isClosed(): boolean {
		return this.closed;
	}

	getService(): string | undefined {
		return this.service;
	}

	getEnvironment(): string | undefined {
		return this.environment;
	}

	getVersion(): string | undefined {
		return this.version;
	}

	getFields(): Record<string, unknown> | undefined {
		return this.fields;
	}
}

describe('Sink Module', () => {
	describe('Sink interface', () => {
		test('should implement all required methods', () => {
			const sink = new FakeSink();

			expect(typeof sink.write).toBe('function');
			expect(typeof sink.flush).toBe('function');
			expect(typeof sink.close).toBe('function');
		});

		test('write should be an async method', async () => {
			const sink = new FakeSink();
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
			};

			await expect(sink.write(entry)).resolves.toBeUndefined();
		});

		test('flush should be an async method', async () => {
			const sink = new FakeSink();

			await expect(sink.flush()).resolves.toBeUndefined();
		});

		test('close should be an async method', async () => {
			const sink = new FakeSink();

			await expect(sink.close()).resolves.toBeUndefined();
		});
	});

	describe('SinkOptions interface', () => {
		test('should accept all optional fields', () => {
			const options: SinkOptions = {
				service: 'test-service',
				environment: 'test',
				version: '1.0.0',
				fields: { region: 'us-east-1' },
			};

			expect(options.service).toBe('test-service');
			expect(options.environment).toBe('test');
			expect(options.version).toBe('1.0.0');
			expect(options.fields).toEqual({ region: 'us-east-1' });
		});

		test('should accept empty SinkOptions', () => {
			const options: SinkOptions = {};

			expect(options.service).toBeUndefined();
			expect(options.environment).toBeUndefined();
			expect(options.version).toBeUndefined();
			expect(options.fields).toBeUndefined();
		});

		test('should accept only some fields', () => {
			const options: SinkOptions = {
				service: 'partial-service',
				version: '2.0.0',
			};

			expect(options.service).toBe('partial-service');
			expect(options.version).toBe('2.0.0');
			expect(options.environment).toBeUndefined();
			expect(options.fields).toBeUndefined();
		});

		test('fields should accept Record<string, unknown>', () => {
			const complexFields = {
				string: 'value',
				number: 123,
				boolean: true,
				array: [1, 2, 3],
				object: { nested: 'value' },
				null: null,
			};

			const options: SinkOptions = {
				fields: complexFields,
			};

			expect(options.fields).toEqual(complexFields);
		});
	});

	describe('FakeSink implementation', () => {
		test('constructor without options should create empty sink', () => {
			const sink = new FakeSink();

			expect(sink).toBeInstanceOf(FakeSink);
			expect(sink.isClosed()).toBe(false);
			expect(sink.getEntries()).toEqual([]);
		});

		test('constructor with options should apply configurations', () => {
			const options: SinkOptions = {
				service: 'test-service',
				environment: 'test',
				version: '1.0.0',
				fields: { region: 'us-east-1' },
			};

			const sink = new FakeSink(options);

			expect(sink.getService()).toBe('test-service');
			expect(sink.getEnvironment()).toBe('test');
			expect(sink.getVersion()).toBe('1.0.0');
			expect(sink.getFields()).toEqual({ region: 'us-east-1' });
		});

		test('write should store log entry', async () => {
			const sink = new FakeSink();
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
			};

			await sink.write(entry);

			const entries = sink.getEntries();
			expect(entries).toHaveLength(1);
			expect(entries[0]).toMatchObject(entry);
		});

		test('write should enrich entry with sink fields', async () => {
			const options: SinkOptions = {
				service: 'test-service',
				environment: 'test',
				fields: { region: 'us-east-1' },
			};

			const sink = new FakeSink(options);
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
			};

			await sink.write(entry);

			const entries = sink.getEntries();
			expect(entries[0]).toMatchObject({
				...entry,
				service: 'test-service',
				environment: 'test',
				region: 'us-east-1',
			});
		});

		test('multiple writes should accumulate entries', async () => {
			const sink = new FakeSink();
			const entry1: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'test1' },
				outcome: 'success',
				durationMs: 100,
			};
			const entry2: LogEntry = {
				timestamp: '2023-01-01T00:01:00.000Z',
				level: 'error',
				scope: { methodName: 'test2' },
				outcome: 'failure',
				durationMs: 200,
			};

			await sink.write(entry1);
			await sink.write(entry2);

			const entries = sink.getEntries();
			expect(entries).toHaveLength(2);
			expect(entries[0]).toMatchObject(entry1);
			expect(entries[1]).toMatchObject(entry2);
		});

		test('close should mark sink as closed', async () => {
			const sink = new FakeSink();

			expect(sink.isClosed()).toBe(false);

			await sink.close();

			expect(sink.isClosed()).toBe(true);
		});

		test('write after close should throw error', async () => {
			const sink = new FakeSink();
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
			};

			await sink.close();

			await expect(sink.write(entry)).rejects.toThrow('Sink is closed');
		});

		test('flush after close should throw error', async () => {
			const sink = new FakeSink();

			await sink.close();

			await expect(sink.flush()).rejects.toThrow('Sink is closed');
		});

		test('multiple close calls should not throw error', async () => {
			const sink = new FakeSink();

			await sink.close();
			await expect(sink.close()).resolves.toBeUndefined();
		});
	});

	describe('Type validation', () => {
		test('Sink should be compatible with fake implementation', () => {
			const sink: Sink = new FakeSink();

			expect(typeof sink.write).toBe('function');
			expect(typeof sink.flush).toBe('function');
			expect(typeof sink.close).toBe('function');
		});

		test('SinkOptions should be compatible with fake implementation', () => {
			const options: SinkOptions = {
				service: 'test-service',
				environment: 'test',
				version: '1.0.0',
				fields: { region: 'us-east-1' },
			};

			const sink = new FakeSink(options);

			expect(sink).toBeInstanceOf(FakeSink);
		});

		test('LogEntry should be compatible with write', async () => {
			const sink = new FakeSink();
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
			};

			await expect(sink.write(entry)).resolves.toBeUndefined();
		});
	});

	describe('Edge cases', () => {
		test('should allow fields to be empty object', () => {
			const options: SinkOptions = {
				fields: {},
			};

			const sink = new FakeSink(options);
			expect(sink.getFields()).toEqual({});
		});

		test('should allow service to be empty string', () => {
			const options: SinkOptions = {
				service: '',
			};

			const sink = new FakeSink(options);
			expect(sink.getService()).toBe('');
		});

		test('should allow environment to be empty string', () => {
			const options: SinkOptions = {
				environment: '',
			};

			const sink = new FakeSink(options);
			expect(sink.getEnvironment()).toBe('');
		});

		test('should allow version to be empty string', () => {
			const options: SinkOptions = {
				version: '',
			};

			const sink = new FakeSink(options);
			expect(sink.getVersion()).toBe('');
		});

		test('write with minimal entry should work', async () => {
			const sink = new FakeSink();
			const minimalEntry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'test' },
				outcome: 'success',
				durationMs: 0,
			};

			await sink.write(minimalEntry);

			const entries = sink.getEntries();
			expect(entries).toHaveLength(1);
			expect(entries[0]).toMatchObject(minimalEntry);
		});

		test('write with complete entry should work', async () => {
			const sink = new FakeSink();
			const fullEntry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'error',
				scope: { className: 'TestClass', methodName: 'testMethod' },
				outcome: 'failure',
				args: ['arg1', 'arg2'],
				result: { data: 'test' },
				error: { name: 'Error', message: 'Test error', stack: 'Error: Test error\n    at test' },
				correlationId: 'test-cid',
				durationMs: 150,
			};

			await sink.write(fullEntry);

			const entries = sink.getEntries();
			expect(entries).toHaveLength(1);
			expect(entries[0]).toMatchObject(fullEntry);
		});
	});

	// attachSink foi removido na refatoração - responsabilidade movida para ComposedLogger
});
