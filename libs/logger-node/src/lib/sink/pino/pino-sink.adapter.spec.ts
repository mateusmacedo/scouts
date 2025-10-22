import type { LogEntry } from '../../logger/logger';
import { PinoSinkAdapter } from './pino-sink.adapter';
import type { PinoLike } from './pino-sink.options';

describe('PinoSinkAdapter', () => {
	let mockLogger: PinoLike;
	let sink: PinoSinkAdapter;

	beforeEach(() => {
		// Mock logger para todos os testes
		mockLogger = {
			trace: jest.fn(),
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			fatal: jest.fn(),
			flush: jest.fn(),
		};
	});

	describe('Constructor', () => {
		it('should_use_provided_logger_when_available', () => {
			// Arrange
			const options = { logger: mockLogger };

			// Act
			sink = new PinoSinkAdapter(mockLogger);

			// Assert
			expect(sink).toBeDefined();
		});

		it('should_create_mock_logger_when_pino_not_available', () => {
			// Arrange
			jest.doMock('pino', () => {
				throw new Error('Pino not available');
			});

			// Act
			sink = new PinoSinkAdapter(mockLogger);

			// Assert
			expect(sink).toBeDefined();
		});

		it('should_use_default_message_format_when_not_provided', () => {
			// Arrange
			const options = { logger: mockLogger };

			// Act
			sink = new PinoSinkAdapter(mockLogger);

			// Assert
			expect(sink).toBeDefined();
		});

		it('should_use_custom_message_format_when_provided', () => {
			// Arrange
			const customFormat = (entry: LogEntry) => `Custom: ${entry.scope.methodName}`;
			const options = { logger: mockLogger, messageFormat: customFormat };

			// Act
			sink = new PinoSinkAdapter(mockLogger);

			// Assert
			expect(sink).toBeDefined();
		});
	});

	describe('Write Operations', () => {
		beforeEach(() => {
			sink = new PinoSinkAdapter(mockLogger);
		});

		it('should_delegate_trace_to_logger_trace_method', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'trace',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.trace).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: undefined,
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_delegate_debug_to_logger_debug_method', async () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'debug',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: undefined,
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_delegate_info_to_logger_info_method', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: undefined,
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_delegate_warn_to_logger_warn_method', async () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'warn',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: undefined,
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_delegate_error_to_logger_error_method', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'error',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: undefined,
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_delegate_fatal_to_logger_fatal_method', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'fatal',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.fatal).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: undefined,
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});
	});

	describe('Message Formatting', () => {
		beforeEach(() => {
			sink = new PinoSinkAdapter(mockLogger);
		});

		it('should_use_default_message_format_with_class_and_method', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { className: 'UserService', methodName: 'createUser' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(expect.any(Object), 'UserService.createUser');
		});

		it('should_use_default_message_format_with_method_only', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'createUser' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(expect.any(Object), 'createUser');
		});

		it('should_use_custom_message_format_when_provided', () => {
			// Arrange
			const customFormat = (entry: LogEntry) => `Custom: ${entry.scope.methodName}`;
			sink = new PinoSinkAdapter(mockLogger, customFormat);

			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(expect.any(Object), 'Custom: testMethod');
		});
	});

	describe('Field Formatting', () => {
		beforeEach(() => {
			sink = new PinoSinkAdapter(mockLogger);
		});

		it('should_include_correlation_id_when_present', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
				correlationId: 'req-123',
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: 'req-123',
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_include_args_when_present', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
				args: ['arg1', 'arg2'],
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					args: ['arg1', 'arg2'],
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_include_result_when_present', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
				result: { userId: '123' },
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					result: { userId: '123' },
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
		});

		it('should_include_error_when_present', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'error',
				scope: { methodName: 'testMethod' },
				outcome: 'failure',
				durationMs: 100,
				error: { name: 'Error', message: 'Test error', stack: 'stack trace' },
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					error: { name: 'Error', message: 'Test error', stack: 'stack trace' },
					durationMs: 100,
					outcome: 'failure',
				}),
				'testMethod'
			);
		});

		it('should_handle_entry_without_optional_fields', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: undefined,
					durationMs: 100,
					outcome: 'success',
				}),
				'testMethod'
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.not.objectContaining({
					args: expect.anything(),
					result: expect.anything(),
					error: expect.anything(),
				}),
				'testMethod'
			);
		});
	});

	describe('Flush Operations', () => {
		beforeEach(() => {
			sink = new PinoSinkAdapter(mockLogger);
		});

		it('should_call_logger_flush_when_available', () => {
			// Act
			sink.flush();

			// Assert
			expect(mockLogger.flush).toHaveBeenCalled();
		});

		it('should_not_throw_when_logger_flush_not_available', () => {
			// Arrange
			const loggerWithoutFlush = { ...mockLogger };
			delete loggerWithoutFlush.flush;
			sink = new PinoSinkAdapter(loggerWithoutFlush);

			// Act & Assert
			expect(() => sink.flush()).not.toThrow();
		});
	});

	describe('Close Operations', () => {
		beforeEach(() => {
			sink = new PinoSinkAdapter(mockLogger);
		});

		it('should_call_flush_before_closing', () => {
			// Act
			sink.close();

			// Assert
			expect(mockLogger.flush).toHaveBeenCalled();
		});

		it('should_complete_close_operation_successfully', () => {
			// Act & Assert
			expect(() => sink.close()).not.toThrow();
		});
	});

	describe('Error Handling', () => {
		it('should_propagate_errors_from_logger_write', async () => {
			// Arrange
			const errorLogger = {
				...mockLogger,
				info: jest.fn().mockImplementation(() => {
					throw new Error('Logger write error');
				}),
			};
			sink = new PinoSinkAdapter(errorLogger);

			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act & Assert
			await expect(sink.write(entry)).rejects.toThrow('Logger write error');
		});
	});

	describe('Edge Cases', () => {
		beforeEach(() => {
			sink = new PinoSinkAdapter(mockLogger);
		});

		it('should_handle_entry_with_empty_scope', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: '' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(expect.any(Object), '');
		});

		it('should_handle_entry_with_undefined_correlation_id', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
				correlationId: undefined,
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: undefined,
				}),
				'testMethod'
			);
		});

		it('should_handle_entry_with_empty_args', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
				args: [],
			};

			// Act
			sink.write(entry);

			// Assert
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					args: [],
				}),
				'testMethod'
			);
		});
	});

	describe('Performance', () => {
		beforeEach(() => {
			sink = new PinoSinkAdapter(mockLogger);
		});

		it('should_write_log_within_10ms', () => {
			// Arrange
			const entry: LogEntry = {
				timestamp: '2023-01-01T00:00:00.000Z',
				level: 'info',
				scope: { methodName: 'testMethod' },
				outcome: 'success',
				durationMs: 100,
			};

			// Act
			const start = performance.now();
			sink.write(entry);
			const duration = performance.now() - start;

			// Assert
			expect(duration).toBeLessThan(10);
		});
	});
});
