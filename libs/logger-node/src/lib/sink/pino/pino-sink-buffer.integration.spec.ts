import type { LogEntry } from '../../logger/logger';
import { PinoSinkAdapter } from './pino-sink.adapter';
import { createPinoSink } from './pino-sink.factory';

// Mock do Pino
const mockPinoLogger = {
	trace: jest.fn(),
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	fatal: jest.fn(),
	flush: jest.fn(),
};

jest.mock('pino', () => {
	return jest.fn(() => mockPinoLogger);
});

describe('PinoSink Buffer Integration', () => {
	let sink: PinoSinkAdapter;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(async () => {
		if (sink) {
			await sink.close();
		}
	});

	describe('Buffer Configuration', () => {
		test('should create sink with buffer when bufferSize is provided', async () => {
			sink = new PinoSinkAdapter(mockPinoLogger, undefined, {
				bufferSize: 10,
				flushInterval: 100,
				enableBackpressure: false,
			});

			const stats = sink.getBufferStats();
			expect(stats.hasBuffer).toBe(true);
			expect(stats.stats?.capacity).toBe(10);
		});

		test('should create sink without buffer when bufferSize is not provided', () => {
			sink = new PinoSinkAdapter(mockPinoLogger, undefined, {});

			const stats = sink.getBufferStats();
			expect(stats.hasBuffer).toBe(false);
		});

		test('should create sink without buffer when bufferSize is 0', () => {
			sink = new PinoSinkAdapter(mockPinoLogger, undefined, { bufferSize: 0 });

			const stats = sink.getBufferStats();
			expect(stats.hasBuffer).toBe(false);
		});
	});

	describe('Buffer Operations', () => {
		test('should buffer entries when buffer is active', async () => {
			sink = new PinoSinkAdapter(mockPinoLogger, undefined, {
				bufferSize: 3,
				flushInterval: 1000, // Long interval to prevent auto-flush
			});

			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await sink.write(entry);

			// Should not call logger immediately (buffered)
			expect(mockPinoLogger.info).not.toHaveBeenCalled();

			// Manual flush should write to logger
			await sink.flush();
			expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
		});

		test('should handle buffer overflow with backpressure', async () => {
			sink = new PinoSinkAdapter(mockPinoLogger, undefined, {
				bufferSize: 2,
				flushInterval: 1000, // Long interval
				enableBackpressure: true,
			});

			const entries: LogEntry[] = [
				{
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test1' },
					outcome: 'success',
					durationMs: 100,
					args: ['Message 1'],
				},
				{
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test2' },
					outcome: 'success',
					durationMs: 100,
					args: ['Message 2'],
				},
				{
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test3' },
					outcome: 'success',
					durationMs: 100,
					args: ['Message 3'],
				},
			];

			// Add entries (third should trigger backpressure)
			for (const entry of entries) {
				await sink.write(entry);
			}

			// Should have called logger for the third entry (backpressure)
			expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
		});

		test('should handle buffer overflow without backpressure', async () => {
			sink = new PinoSinkAdapter(mockPinoLogger, undefined, {
				bufferSize: 2,
				flushInterval: 1000, // Long interval
				enableBackpressure: false,
			});

			const entries: LogEntry[] = [
				{
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test1' },
					outcome: 'success',
					durationMs: 100,
					args: ['Message 1'],
				},
				{
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test2' },
					outcome: 'success',
					durationMs: 100,
					args: ['Message 2'],
				},
				{
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test3' },
					outcome: 'success',
					durationMs: 100,
					args: ['Message 3'],
				},
			];

			// Add entries (third should be dropped)
			for (const entry of entries) {
				await sink.write(entry);
			}

			// Should not have called logger (entries dropped)
			expect(mockPinoLogger.info).not.toHaveBeenCalled();
		});
	});

	describe('Factory Integration', () => {
		test('should create sink with buffer via factory', async () => {
			const pinoSink = await createPinoSink({
				bufferSize: 5,
				flushInterval: 100,
				enableBackpressure: true,
			});

			// Verificar se é um PinoSinkAdapter
			expect(pinoSink).toBeInstanceOf(require('./pino-sink.adapter').PinoSinkAdapter);

			const stats = (pinoSink as any).getBufferStats();
			expect(stats.hasBuffer).toBe(true);
			expect(stats.stats?.capacity).toBe(5);

			await pinoSink.close();
		});

		test('should create sink without buffer via factory', async () => {
			const pinoSink = await createPinoSink({});

			// Verificar se é um PinoSinkAdapter
			expect(pinoSink).toBeInstanceOf(require('./pino-sink.adapter').PinoSinkAdapter);

			const stats = (pinoSink as any).getBufferStats();
			expect(stats.hasBuffer).toBe(false);

			await pinoSink.close();
		});
	});

	describe('Close Operations', () => {
		test('should flush buffer on close', async () => {
			sink = new PinoSinkAdapter(mockPinoLogger, undefined, {
				bufferSize: 3,
				flushInterval: 1000, // Long interval
			});

			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await sink.write(entry);
			await sink.close();

			// Should have flushed on close
			expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
		});
	});

	describe('Buffer Statistics', () => {
		test('should provide buffer statistics', async () => {
			sink = new PinoSinkAdapter(mockPinoLogger, undefined, {
				bufferSize: 5,
				flushInterval: 1000,
			});

			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await sink.write(entry);

			const stats = sink.getBufferStats();
			expect(stats.hasBuffer).toBe(true);
			expect(stats.stats?.count).toBe(1);
			expect(stats.stats?.capacity).toBe(5);
			expect(stats.stats?.utilization).toBe(0.2);
			expect(stats.stats?.isFlushing).toBe(false);
		});
	});
});
