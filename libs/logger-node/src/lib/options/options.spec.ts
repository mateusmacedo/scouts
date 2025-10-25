import type { LogLevel } from '../logger/logger';
import type { LoggerOptions, LogOptions } from './options';

describe('Options Module', () => {
	describe('LoggerOptions interface', () => {
		test('should accept all optional fields', () => {
			const options: LoggerOptions = {
				level: 'info',
				fields: { service: 'test' },
				getCorrelationId: () => 'test-cid',
			};

			expect(options.level).toBe('info');
			expect(options.fields).toEqual({ service: 'test' });
			expect(typeof options.getCorrelationId).toBe('function');
			expect(options.getCorrelationId?.()).toBe('test-cid');
		});

		test('should accept empty LoggerOptions', () => {
			const options: LoggerOptions = {};

			expect(options.level).toBeUndefined();
			expect(options.fields).toBeUndefined();
			expect(options.getCorrelationId).toBeUndefined();
		});

		test('should accept only some fields', () => {
			const options: LoggerOptions = {
				level: 'debug',
			};

			expect(options.level).toBe('debug');
		});

		test('should allow getCorrelationId to return undefined', () => {
			const options: LoggerOptions = {
				getCorrelationId: () => undefined,
			};

			expect(options.getCorrelationId?.()).toBeUndefined();
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

			const options: LoggerOptions = {
				fields: complexFields,
			};

			expect(options.fields).toEqual(complexFields);
		});
	});

	describe('LogOptions interface', () => {
		test('should accept all optional fields', () => {
			const options: LogOptions = {
				level: 'warn',
				includeArgs: true,
				includeResult: false,
				sampleRate: 0.5,
				getCorrelationId: () => 'log-cid',
				includeStackTrace: true,
			};

			expect(options.level).toBe('warn');
			expect(options.includeArgs).toBe(true);
			expect(options.includeResult).toBe(false);
			expect(options.sampleRate).toBe(0.5);
			expect(typeof options.getCorrelationId).toBe('function');
			expect(options.getCorrelationId?.()).toBe('log-cid');
			expect(options.includeStackTrace).toBe(true);
		});

		test('should accept empty LogOptions', () => {
			const options: LogOptions = {};

			expect(options.level).toBeUndefined();
			expect(options.includeArgs).toBeUndefined();
			expect(options.includeResult).toBeUndefined();
			expect(options.sampleRate).toBeUndefined();
			expect(options.getCorrelationId).toBeUndefined();
			expect(options.includeStackTrace).toBeUndefined();
		});

		test('should accept only boolean fields', () => {
			const options: LogOptions = {
				includeArgs: false,
				includeResult: true,
				includeStackTrace: false,
			};

			expect(options.includeArgs).toBe(false);
			expect(options.includeResult).toBe(true);
			expect(options.includeStackTrace).toBe(false);
		});

		test('sampleRate should accept values between 0 and 1', () => {
			const options1: LogOptions = { sampleRate: 0 };
			const options2: LogOptions = { sampleRate: 0.5 };
			const options3: LogOptions = { sampleRate: 1 };

			expect(options1.sampleRate).toBe(0);
			expect(options2.sampleRate).toBe(0.5);
			expect(options3.sampleRate).toBe(1);
		});

		test('should allow getCorrelationId to return undefined', () => {
			const options: LogOptions = {
				getCorrelationId: () => undefined,
			};

			expect(options.getCorrelationId?.()).toBeUndefined();
		});
	});

	describe('Type validation', () => {
		test('LogLevel should be compatible between interfaces', () => {
			const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

			for (const level of validLevels) {
				const loggerOptions: LoggerOptions = { level };
				const logOptions: LogOptions = { level };

				expect(loggerOptions.level).toBe(level);
				expect(logOptions.level).toBe(level);
			}
		});

		test('getCorrelationId should have correct signature', () => {
			const fn1: () => string | undefined = () => 'test';
			const fn2: () => string | undefined = () => undefined;

			const loggerOptions: LoggerOptions = { getCorrelationId: fn1 };
			const logOptions: LogOptions = { getCorrelationId: fn2 };

			expect(typeof loggerOptions.getCorrelationId).toBe('function');
			expect(typeof logOptions.getCorrelationId).toBe('function');
			expect(loggerOptions.getCorrelationId?.()).toBe('test');
			expect(logOptions.getCorrelationId?.()).toBeUndefined();
		});
	});

	describe('Edge cases', () => {
		test('should allow fields to be empty object', () => {
			const options: LoggerOptions = {
				fields: {},
			};

			expect(options.fields).toEqual({});
		});

		test('sampleRate can be 0 or 1', () => {
			const options1: LogOptions = { sampleRate: 0 };
			const options2: LogOptions = { sampleRate: 1 };

			expect(options1.sampleRate).toBe(0);
			expect(options2.sampleRate).toBe(1);
		});

		test('should allow getCorrelationId to be function that always returns string', () => {
			const options: LoggerOptions = {
				getCorrelationId: () => 'always-string',
			};

			expect(options.getCorrelationId?.()).toBe('always-string');
		});

		test('should allow getCorrelationId to be function that always returns undefined', () => {
			const options: LogOptions = {
				getCorrelationId: () => undefined,
			};

			expect(options.getCorrelationId?.()).toBeUndefined();
		});
	});
});
