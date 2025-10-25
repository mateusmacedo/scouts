/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { Logger } from '../logger/logger';

/**
 * Métricas genéricas universais para todos os loggers
 * Independente da implementação específica (Pino, Winston, Console, etc.)
 */
export interface BaseLoggerMetrics {
	/** Total de logs gravados com sucesso */
	logsWritten: number;
	/** Número de logs descartados por erro/limitação */
	logsDropped: number;
	/** Total de erros encontrados durante logging */
	errorCount: number;
	/** Uptime em milissegundos (derivado a partir do startTime, não armazenado) */
	uptimeMs: number;
	/** Número de operações de redação realizadas */
	redactCount: number;
	/** Latência média de redação em milissegundos */
	redactLatencyMs: number;
	/** Número de flushes realizados */
	flushCount: number;
	/** Taxa de utilização do buffer (0-1) */
	bufferUtilization: number;
}

/**
 * Tipo de métricas padrão (expansível via generics nos consumidores).
 * Removemos o union com Record<string, unknown> para garantir type-safety.
 */
export type LoggerMetrics = BaseLoggerMetrics;

/**
 * Interface para loggers que expõem métricas.
 * T é extensível pelos adapters específicos, preservando o contrato base.
 */
export interface LoggerWithMetrics<T extends LoggerMetrics = LoggerMetrics> extends Logger {
	/**
	 * Obtém métricas (leitura pura, sem efeitos colaterais).
	 */
	getMetrics(): Readonly<T>;
}

/**
 * Coleção de chaves incrementáveis. uptimeMs é calculado sob demanda
 * e, portanto, excluído de incrementos.
 */
type IncrementableMetric = Exclude<keyof BaseLoggerMetrics, 'uptimeMs'>;

/**
 * Estrutura interna sem uptimeMs (mantemos apenas o que é acumulativo).
 */
type InternalMetrics = Omit<BaseLoggerMetrics, 'uptimeMs'>;

/**
 * Coletor de métricas genéricas, sem estado global e sem side effects em getters.
 * Responsável por contar eventos de logging, descartes e erros.
 */
export class BaseMetricsCollector {
	private metrics: InternalMetrics;
	private startTime: number;

	constructor() {
		this.startTime = Date.now();
		this.metrics = {
			logsWritten: 0,
			logsDropped: 0,
			errorCount: 0,
			redactCount: 0,
			redactLatencyMs: 0,
			flushCount: 0,
			bufferUtilization: 0,
		};
	}

	/**
	 * Incrementa uma métrica acumulativa de forma type-safe.
	 * uptimeMs é excluído por tipo (não pode ser incrementado).
	 */
	increment(metric: IncrementableMetric, value: number = 1): void {
		// Garantia de índice seguro, pois `metric` ∈ keys de InternalMetrics
		this.metrics[metric] += value;
	}

	/**
	 * Lê métricas sem modificar estado (método puro).
	 * uptimeMs é calculado sob demanda.
	 */
	getMetrics(): Readonly<BaseLoggerMetrics> {
		const uptimeMs = Date.now() - this.startTime;
		return {
			logsWritten: this.metrics.logsWritten,
			logsDropped: this.metrics.logsDropped,
			errorCount: this.metrics.errorCount,
			uptimeMs,
			redactCount: this.metrics.redactCount,
			redactLatencyMs: this.metrics.redactLatencyMs,
			flushCount: this.metrics.flushCount,
			bufferUtilization: this.metrics.bufferUtilization,
		};
	}

	/**
	 * Reseta os contadores e reinicia o cronômetro.
	 */
	reset(): void {
		this.metrics = {
			logsWritten: 0,
			logsDropped: 0,
			errorCount: 0,
			redactCount: 0,
			redactLatencyMs: 0,
			flushCount: 0,
			bufferUtilization: 0,
		};
		this.startTime = Date.now();
	}
}

/**
 * Opções para acoplar métricas a um Logger existente via Proxy.
 * - methods: lista de métodos de logging a interceptar.
 * - onErrorDrop: define se exceções durante o chamado contam como drop + errorCount.
 */
export interface AttachMetricsOptions {
	/**
	 * Métodos de logging a instrumentar. Por padrão, cobre a maioria dos loggers.
	 * Ajuste conforme a interface concreta do seu Logger.
	 */
	methods?: readonly string[];
	/**
	 * Se true, quando o método de log lançar exceção, contamos logsDropped + errorCount.
	 * Caso false, somente errorCount é incrementado.
	 * Default: true
	 */
	onErrorDrop?: boolean;
}

/**
 * Lista padrão de métodos candidatos a logging nas bibliotecas mais comuns.
 * Você pode restringir isso nas opções.
 */
const DEFAULT_METHODS: readonly string[] = [
	'fatal',
	'error',
	'warn',
	'info',
	'debug',
	'trace',
	'log',
] as const;

/**
 * Acopla um coletor de métricas a um Logger existente via Proxy,
 * sem intrusão no algoritmo principal (FC/IS-friendly).
 *
 * - Não cria estado global.
 * - Não depende de implementação específica de logger.
 * - Intercepta apenas os métodos configurados em `options.methods`.
 * - Expõe getMetrics() no logger retornado.
 */
export function attachMetrics<L extends Logger, T extends LoggerMetrics = LoggerMetrics>(
	logger: L,
	collector: BaseMetricsCollector = new BaseMetricsCollector(),
	options?: AttachMetricsOptions
): L & LoggerWithMetrics<T> {
	const methods = options?.methods ?? DEFAULT_METHODS;
	const onErrorDrop = options?.onErrorDrop ?? true;

	const handler: ProxyHandler<L> = {
		get(target, prop, receiver) {
			// Expor getMetrics diretamente no proxy.
			if (prop === 'getMetrics') {
				return () => collector.getMetrics();
			}

			const orig = Reflect.get(target, prop, receiver);

			// Se for um método configurado como logging, aplicamos contagem.
			if (typeof prop === 'string' && methods.includes(prop) && typeof orig === 'function') {
				return (...args: unknown[]) => {
					try {
						const result = orig.apply(target, args);
						// Suporta métodos síncronos e assíncronos.
						if (isPromiseLike(result)) {
							return result
								.then((val) => {
									collector.increment('logsWritten', 1);
									return val;
								})
								.catch((err) => {
									collector.increment('errorCount', 1);
									if (onErrorDrop) collector.increment('logsDropped', 1);
									throw err;
								});
						} else {
							collector.increment('logsWritten', 1);
							return result;
						}
					} catch (err) {
						collector.increment('errorCount', 1);
						if (onErrorDrop) collector.increment('logsDropped', 1);
						throw err;
					}
				};
			}

			// Acesso normal caso não seja um método interceptado.
			return orig;
		},
	};

	return new Proxy(logger, handler) as L & LoggerWithMetrics<T>;
}

/**
 * Predicado utilitário para detectar Promises sem comprometer type-safety.
 */
function isPromiseLike<T = unknown>(val: unknown): val is Promise<T> {
	return (
		!!val &&
		typeof (val as { then?: unknown; catch?: unknown }).then === 'function' &&
		typeof (val as { then?: unknown; catch?: unknown }).catch === 'function'
	);
}
