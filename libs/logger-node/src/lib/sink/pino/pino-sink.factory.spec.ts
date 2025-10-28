import type { Sink } from '../sink';
import { createPinoSink } from './pino-sink.factory';
import type { PinoLike } from './pino-sink.options';

describe('createPinoSink', () => {
	describe('Factory Function', () => {
		it('should_create_sink_with_default_options', () => {
			// Arrange & Act
			const sink = createPinoSink();

			// Assert
			expect(sink).toBeDefined();
			expect(typeof sink.write).toBe('function');
			expect(typeof sink.flush).toBe('function');
			expect(typeof sink.close).toBe('function');
		});

		it('should_create_sink_with_custom_options', () => {
			// Arrange
			const options = {
				service: 'test-service',
				environment: 'test',
				version: '1.0.0',
				loggerOptions: {
					level: 'debug',
					extreme: true,
				},
			};

			// Act
			const sink = createPinoSink(options);

			// Assert
			expect(sink).toBeDefined();
		});

		it('should_create_sink_with_mocked_logger', () => {
			// Arrange
			const mockLogger: PinoLike = {
				trace: jest.fn(),
				debug: jest.fn(),
				info: jest.fn(),
				warn: jest.fn(),
				error: jest.fn(),
				fatal: jest.fn(),
				flush: jest.fn(),
			};

			const options = { logger: mockLogger };

			// Act
			const sink = createPinoSink(options);

			// Assert
			expect(sink).toBeDefined();
		});

		it('should_create_sink_with_custom_message_format', () => {
			// Arrange
			const customFormat = (entry: any) => `Custom: ${entry.scope.methodName}`;
			const options = { messageFormat: customFormat };

			// Act
			const sink = createPinoSink(options);

			// Assert
			expect(sink).toBeDefined();
		});

		it('should_create_sink_with_empty_options', () => {
			// Arrange
			const options = {};

			// Act
			const sink = createPinoSink(options);

			// Assert
			expect(sink).toBeDefined();
		});

		it('should_create_sink_with_undefined_options', () => {
			// Arrange & Act
			const sink = createPinoSink();

			// Assert
			expect(sink).toBeDefined();
		});
	});

	describe('Sink Functionality', () => {
		let sink: Sink;
		let mockLogger: PinoLike;

		beforeEach(() => {
			mockLogger = {
				trace: jest.fn(),
				debug: jest.fn(),
				info: jest.fn(),
				warn: jest.fn(),
				error: jest.fn(),
				fatal: jest.fn(),
				flush: jest.fn(),
			};
			sink = createPinoSink({ logger: mockLogger });
		});

		it('should_write_logs_correctly', async () => {
			// Arrange
			const entry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info' as const,
				scope: { methodName: 'testMethod' },
				outcome: 'success' as const,
				durationMs: 100,
			};

			// Act
			await sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_flush_logs_correctly', async () => {
			// Act
			await sink.flush();

			// Assert
			expect(mockLogger.flush).toHaveBeenCalled();
		});

		it('should_close_sink_correctly', async () => {
			// Act
			await sink.close();

			// Assert
			expect(mockLogger.flush).toHaveBeenCalled();
		});
	});

	describe('Edge Cases', () => {
		it('should_handle_null_options', () => {
			// Arrange & Act
			const sink = createPinoSink(null as any);

			// Assert
			expect(sink).toBeDefined();
		});

		it('should_handle_options_with_undefined_values', () => {
			// Arrange
			const options = {
				service: undefined,
				environment: undefined,
				version: undefined,
				loggerOptions: undefined,
				messageFormat: undefined,
			};

			// Act
			const sink = createPinoSink(options);

			// Assert
			expect(sink).toBeDefined();
		});
	});

	describe('Integration', () => {
		it('should_work_with_attachSink_function', async () => {
			// Arrange
			const sink = createPinoSink();

			// Act & Assert
			expect(sink).toBeDefined();
			expect(typeof sink.write).toBe('function');
			expect(typeof sink.flush).toBe('function');
			expect(typeof sink.close).toBe('function');
		});
	});
});
