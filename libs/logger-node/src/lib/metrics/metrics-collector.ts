import type { BaseLoggerMetrics } from './metrics';
import { BaseMetricsCollector } from './metrics';

/**
 * Métricas avançadas com cálculos derivados e tracking de performance
 */
export interface EnhancedLoggerMetrics extends BaseLoggerMetrics {
	/** Logs por segundo (calculado) */
	logsPerSecond: number;
	/** Taxa de erro (calculado) */
	errorRate: number;
	/** Latência média de redação (calculado) */
	averageRedactLatency: number;
	/** Taxa de utilização do buffer (calculado) */
	bufferUtilizationRate: number;
}

/**
 * Coletor de métricas avançado com cálculos derivados e tracking de performance
 * Baseado no draft logger com melhorias para integração
 */
export class MetricsCollector extends BaseMetricsCollector {
	private redactLatencies: number[] = [];
	private bufferSize: number = 0;
	private bufferCapacity: number = 1000; // Default capacity

	constructor() {
		super();
	}

	/**
	 * Incrementa uma métrica básica (sobrescreve para incluir novos campos)
	 */
	override increment(metric: keyof Omit<BaseLoggerMetrics, 'uptimeMs'>, value: number = 1): void {
		super.increment(metric, value);
	}

	/**
	 * Registra latência de redação
	 */
	recordRedactLatency(latencyMs: number): void {
		this.redactLatencies.push(latencyMs);
		super.increment('redactCount', 1);

		// Manter apenas as últimas 100 medições para evitar crescimento descontrolado
		if (this.redactLatencies.length > 100) {
			this.redactLatencies = this.redactLatencies.slice(-100);
		}

		// Atualizar latência média
		this.updateRedactLatency();
	}

	/**
	 * Atualiza utilização do buffer
	 */
	updateBufferUtilization(currentSize: number, capacity: number = this.bufferCapacity): void {
		this.bufferSize = currentSize;
		this.bufferCapacity = capacity;
		// Atualizar métrica de buffer utilization
		this.updateBufferMetric();
	}

	/**
	 * Obtém métricas básicas (sobrescreve para incluir novos campos)
	 */
	override getMetrics(): Readonly<BaseLoggerMetrics> {
		const baseMetrics = super.getMetrics();
		return {
			...baseMetrics,
			redactCount: this.getRedactCount(),
			redactLatencyMs: this.calculateAverageLatency(),
			flushCount: this.getFlushCount(),
			bufferUtilization: this.getBufferUtilization(),
		};
	}

	/**
	 * Obtém métricas avançadas com cálculos derivados
	 */
	getEnhancedMetrics(): Readonly<EnhancedLoggerMetrics> {
		const baseMetrics = this.getMetrics();
		const uptimeSeconds = baseMetrics.uptimeMs / 1000;

		return {
			...baseMetrics,
			logsPerSecond: uptimeSeconds >= 1 ? baseMetrics.logsWritten / uptimeSeconds : 0,
			errorRate: baseMetrics.logsWritten > 0 ? baseMetrics.errorCount / baseMetrics.logsWritten : 0,
			averageRedactLatency: this.calculateAverageLatency(),
			bufferUtilizationRate: this.getBufferUtilization(),
		};
	}

	/**
	 * Calcula latência média de redação
	 */
	private calculateAverageLatency(): number {
		if (this.redactLatencies.length === 0) {
			return 0;
		}

		const sum = this.redactLatencies.reduce((acc, latency) => acc + latency, 0);
		return sum / this.redactLatencies.length;
	}

	/**
	 * Métodos auxiliares para acessar métricas específicas
	 */
	private getRedactCount(): number {
		return (this as any).metrics.redactCount || 0;
	}

	private getFlushCount(): number {
		return (this as any).metrics.flushCount || 0;
	}

	private getBufferUtilization(): number {
		return (this as any).metrics.bufferUtilization || 0;
	}

	private updateRedactLatency(): void {
		(this as any).metrics.redactLatencyMs = this.calculateAverageLatency();
	}

	private updateBufferMetric(): void {
		(this as any).metrics.bufferUtilization = Math.min(this.bufferSize / this.bufferCapacity, 1);
	}

	/**
	 * Reseta todas as métricas (sobrescreve para incluir novos campos)
	 */
	override reset(): void {
		super.reset();
		this.redactLatencies = [];
		this.bufferSize = 0;
	}

	/**
	 * Obtém snapshot das métricas para debugging
	 */
	getSnapshot(): {
		metrics: BaseLoggerMetrics;
		enhanced: EnhancedLoggerMetrics;
		redactLatencies: number[];
		bufferInfo: { size: number; capacity: number };
	} {
		return {
			metrics: this.getMetrics(),
			enhanced: this.getEnhancedMetrics(),
			redactLatencies: [...this.redactLatencies],
			bufferInfo: {
				size: this.bufferSize,
				capacity: this.bufferCapacity,
			},
		};
	}
}
