import { Logger } from '../logger/logger';
import { attachMetrics, BaseMetricsCollector, type LoggerWithMetrics } from './metrics';

// Logger fake minimalista para testes
class FakeLogger implements Logger {
	trace(_msg: string, _fields?: Record<string, unknown>): void {
		/* noop */
	}
	debug(_msg: string, _fields?: Record<string, unknown>): void {
		/* noop */
	}
	info(_msg: string, _fields?: Record<string, unknown>): void {
		/* noop */
	}
	warn(_msg: string, _fields?: Record<string, unknown>): void {
		/* noop */
	}
	error(_msg: string, _fields?: Record<string, unknown>): void {
		/* noop */
	}
	fatal(_msg: string, _fields?: Record<string, unknown>): void {
		/* noop */
	}
	withFields(_fields: Record<string, unknown>): this {
		return this;
	}
	withCorrelationId(_cid: string): this {
		return this;
	}
	flush(): void {
		/* noop */
	}
	close(): void {
		/* noop */
	}

	// Métodos específicos para testes
	boom(_msg: string): void {
		throw new Error('logger failed');
	}
	syncInfo(_msg: string): string {
		return 'ok';
	}
	asyncInfo(_msg: string): string {
		return 'ok';
	}
	asyncBoom(_msg: string): void {
		throw new Error('logger failed');
	}
}

describe('BaseMetricsCollector', () => {
	test('should be pure and calculate uptime without mutating counters', () => {
		const c = new BaseMetricsCollector();
		const first = c.getMetrics();
		expect(first.logsWritten).toBe(0);
		expect(first.logsDropped).toBe(0);
		expect(first.errorCount).toBe(0);
		expect(first.uptimeMs).toBeGreaterThanOrEqual(0);

		// Calling again should not alter counters
		const second = c.getMetrics();
		expect(second.logsWritten).toBe(0);
		expect(second.logsDropped).toBe(0);
		expect(second.errorCount).toBe(0);
		expect(second.uptimeMs).toBeGreaterThanOrEqual(first.uptimeMs);
	});

	test('should only work on cumulative metrics', () => {
		const c = new BaseMetricsCollector();
		c.increment('logsWritten', 2);
		c.increment('logsDropped', 1);
		c.increment('errorCount', 3);

		const m = c.getMetrics();
		expect(m.logsWritten).toBe(2);
		expect(m.logsDropped).toBe(1);
		expect(m.errorCount).toBe(3);
	});

	test('reset should reset counters and restart uptime', () => {
		const c = new BaseMetricsCollector();
		c.increment('logsWritten', 5);
		const before = c.getMetrics();
		expect(before.logsWritten).toBe(5);
		expect(before.uptimeMs).toBeGreaterThanOrEqual(0);

		// wait small time to ensure uptime difference
		new Promise((r) => setTimeout(r, 5));

		c.reset();
		const after = c.getMetrics();
		expect(after.logsWritten).toBe(0);
		expect(after.logsDropped).toBe(0);
		expect(after.errorCount).toBe(0);
		expect(after.uptimeMs).toBeLessThan(before.uptimeMs + 5); // uptime restarted
	});

	test('should increment with default value', () => {
		const c = new BaseMetricsCollector();
		c.increment('logsWritten');
		c.increment('logsDropped');
		c.increment('errorCount');

		const m = c.getMetrics();
		expect(m.logsWritten).toBe(1);
		expect(m.logsDropped).toBe(1);
		expect(m.errorCount).toBe(1);
	});

	test('should increment with custom value', () => {
		const c = new BaseMetricsCollector();
		c.increment('logsWritten', 10);
		c.increment('logsDropped', 5);
		c.increment('errorCount', 3);

		const m = c.getMetrics();
		expect(m.logsWritten).toBe(10);
		expect(m.logsDropped).toBe(5);
		expect(m.errorCount).toBe(3);
	});

	test('multiple increments should accumulate value', () => {
		const c = new BaseMetricsCollector();
		c.increment('logsWritten', 2);
		c.increment('logsWritten', 3);
		c.increment('logsDropped', 1);
		c.increment('errorCount', 2);

		const m = c.getMetrics();
		expect(m.logsWritten).toBe(5);
		expect(m.logsDropped).toBe(1);
		expect(m.errorCount).toBe(2);
	});
});

describe('attachMetrics', () => {
	test('should count logs written in intercepted methods (sync)', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, { methods: ['info', 'error'] });

		logger.info('hello');
		logger.error('world');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(2);
		expect(m.errorCount).toBe(0);
		expect(m.logsDropped).toBe(0);
	});

	test('should count error and drop in sync method error', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, { methods: ['boom'] });

		expect(() => (logger as any).boom('x')).toThrow();

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(0);
		expect(m.errorCount).toBe(1);
		expect(m.logsDropped).toBe(1);
	});

	test('should count logs written in resolved async methods', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, { methods: ['asyncInfo'] });

		expect(() => (logger as any).asyncInfo('ok')).not.toThrow('logger failed');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(1);
		expect(m.errorCount).toBe(0);
		expect(m.logsDropped).toBe(0);
	});

	test('should count error and drop in async method error', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, { methods: ['asyncBoom'] });

		expect(() => (logger as any).asyncBoom('bad')).toThrow('logger failed');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(0);
		expect(m.errorCount).toBe(1);
		expect(m.logsDropped).toBe(1);
	});

	test('onErrorDrop = false should not increment logsDropped in error', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, { methods: ['boom'], onErrorDrop: false });

		expect(() => (logger as any).boom('x')).toThrow();

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsDropped).toBe(0);
		expect(m.errorCount).toBe(1);
	});

	test('should not be intercepted non-configured methods', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, { methods: ['info'] });

		// info is intercepted
		logger.info('hello');

		// error is not intercepted
		logger.error('world');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(1); // only info was counted
	});

	test('should be exposed getMetrics in proxy', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base);

		expect(typeof (logger as any).getMetrics).toBe('function');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m).toHaveProperty('logsWritten');
		expect(m).toHaveProperty('logsDropped');
		expect(m).toHaveProperty('errorCount');
		expect(m).toHaveProperty('uptimeMs');
	});

	test('should use default methods when options.methods is not specified', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base);

		// Default methods include 'info'
		logger.info('test');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(1);
	});

	test('should use custom collector', () => {
		const customCollector = new BaseMetricsCollector();
		const base = new FakeLogger();
		const logger = attachMetrics(base, customCollector);

		logger.info('test');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(1);
	});

	test('should be intercepted multiple methods', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, {
			methods: ['info', 'error', 'boom'],
		});

		logger.info('info message');
		logger.error('error message');

		expect(() => (logger as any).boom('boom message')).toThrow();

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(2); // info + error
		expect(m.errorCount).toBe(1); // boom
		expect(m.logsDropped).toBe(1); // boom
	});

	test('should not be intercepted non-function methods', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, { methods: ['info', 'toString'] });

		logger.info('test');

		// toString should not be intercepted
		expect(typeof logger.toString).toBe('function');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(1);
	});

	test('should count logs written in sync method', () => {
		const base = new FakeLogger();
		const logger = attachMetrics(base, undefined, { methods: ['syncInfo'] });

		const result = (logger as any).syncInfo('test');

		expect(result).toBe('ok');

		const m = (logger as unknown as LoggerWithMetrics).getMetrics();
		expect(m.logsWritten).toBe(1);
		expect(m.errorCount).toBe(0);
		expect(m.logsDropped).toBe(0);
	});
});
