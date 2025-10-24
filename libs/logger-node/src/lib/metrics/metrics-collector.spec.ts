import { MetricsCollector } from './metrics-collector';

describe('MetricsCollector', () => {
	let collector: MetricsCollector;

	beforeEach(() => {
		collector = new MetricsCollector();
	});

	describe('Basic Metrics', () => {
		test('should initialize with zero metrics', () => {
			const metrics = collector.getMetrics();

			expect(metrics.logsWritten).toBe(0);
			expect(metrics.logsDropped).toBe(0);
			expect(metrics.errorCount).toBe(0);
			expect(metrics.redactCount).toBe(0);
			expect(metrics.redactLatencyMs).toBe(0);
			expect(metrics.flushCount).toBe(0);
			expect(metrics.bufferUtilization).toBe(0);
			expect(metrics.uptimeMs).toBeGreaterThanOrEqual(0);
		});

		test('should increment basic metrics', () => {
			collector.increment('logsWritten', 5);
			collector.increment('logsDropped', 2);
			collector.increment('errorCount', 1);
			collector.increment('flushCount', 3);

			const metrics = collector.getMetrics();

			expect(metrics.logsWritten).toBe(5);
			expect(metrics.logsDropped).toBe(2);
			expect(metrics.errorCount).toBe(1);
			expect(metrics.flushCount).toBe(3);
		});

		test('should calculate uptime correctly', async () => {
			// Aguardar um pouco para garantir diferença
			await new Promise((resolve) => setTimeout(resolve, 10));

			const metrics = collector.getMetrics();

			expect(metrics.uptimeMs).toBeGreaterThan(0);
		});
	});

	describe('Redact Latency Tracking', () => {
		test('should record redact latencies', () => {
			collector.recordRedactLatency(50);
			collector.recordRedactLatency(100);
			collector.recordRedactLatency(75);

			const metrics = collector.getMetrics();

			expect(metrics.redactCount).toBe(3);
			expect(metrics.redactLatencyMs).toBe(75); // Average: (50 + 100 + 75) / 3
		});

		test('should maintain only last 100 latencies', () => {
			// Adicionar 150 latências
			for (let i = 0; i < 150; i++) {
				collector.recordRedactLatency(i);
			}

			const metrics = collector.getMetrics();

			expect(metrics.redactCount).toBe(150);
			// Deve manter apenas as últimas 100 (50-149)
			expect(metrics.redactLatencyMs).toBe(99.5); // Average of 50-149
		});

		test('should handle empty latencies', () => {
			const metrics = collector.getMetrics();

			expect(metrics.redactLatencyMs).toBe(0);
		});
	});

	describe('Buffer Utilization', () => {
		test('should update buffer utilization', () => {
			collector.updateBufferUtilization(500, 1000);

			const metrics = collector.getMetrics();
			expect(metrics.bufferUtilization).toBe(0.5);
		});

		test('should cap utilization at 1.0', () => {
			collector.updateBufferUtilization(1500, 1000);

			const metrics = collector.getMetrics();
			expect(metrics.bufferUtilization).toBe(1.0);
		});

		test('should handle zero capacity', () => {
			collector.updateBufferUtilization(100, 0);

			const metrics = collector.getMetrics();
			expect(metrics.bufferUtilization).toBe(1.0);
		});
	});

	describe('Enhanced Metrics', () => {
		test('should calculate enhanced metrics correctly', async () => {
			// Simular atividade
			collector.increment('logsWritten', 100);
			collector.increment('errorCount', 5);
			collector.recordRedactLatency(50);
			collector.recordRedactLatency(100);
			collector.updateBufferUtilization(300, 1000);

			// Aguardar para ter uptime >= 1 segundo
			await new Promise((resolve) => setTimeout(resolve, 1100));

			const enhanced = collector.getEnhancedMetrics();

			expect(enhanced.logsPerSecond).toBeGreaterThan(0);
			expect(enhanced.errorRate).toBe(0.05); // 5/100
			expect(enhanced.averageRedactLatency).toBe(75); // (50 + 100) / 2
			expect(enhanced.bufferUtilizationRate).toBe(0.3);
		});

		test('should handle zero logs for error rate calculation', () => {
			collector.increment('errorCount', 5);

			const enhanced = collector.getEnhancedMetrics();
			expect(enhanced.errorRate).toBe(0);
		});

		test('should handle zero uptime for logs per second', () => {
			collector.increment('logsWritten', 100);

			const enhanced = collector.getEnhancedMetrics();
			expect(enhanced.logsPerSecond).toBe(0);
		});
	});

	describe('Reset Functionality', () => {
		test('should reset all metrics', () => {
			// Adicionar dados
			collector.increment('logsWritten', 10);
			collector.increment('errorCount', 2);
			collector.recordRedactLatency(50);
			collector.updateBufferUtilization(500, 1000);

			// Reset
			collector.reset();

			const metrics = collector.getMetrics();

			expect(metrics.logsWritten).toBe(0);
			expect(metrics.logsDropped).toBe(0);
			expect(metrics.errorCount).toBe(0);
			expect(metrics.redactCount).toBe(0);
			expect(metrics.redactLatencyMs).toBe(0);
			expect(metrics.flushCount).toBe(0);
			expect(metrics.bufferUtilization).toBe(0);
			expect(metrics.uptimeMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Snapshot Functionality', () => {
		test('should provide complete snapshot', async () => {
			// Adicionar dados
			collector.increment('logsWritten', 5);
			collector.recordRedactLatency(100);
			collector.updateBufferUtilization(200, 1000);

			await new Promise((resolve) => setTimeout(resolve, 10));

			const snapshot = collector.getSnapshot();

			expect(snapshot.metrics).toBeDefined();
			expect(snapshot.enhanced).toBeDefined();
			expect(snapshot.redactLatencies).toEqual([100]);
			expect(snapshot.bufferInfo).toEqual({ size: 200, capacity: 1000 });
		});
	});
});
