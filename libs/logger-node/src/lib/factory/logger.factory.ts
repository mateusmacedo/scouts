import type { Logger } from '../logger/logger';
import { ComposedLogger as ComposedLoggerClass } from '../logger/logger';
import { attachMetrics, type LoggerWithMetrics } from '../metrics/metrics';
import { MetricsCollector } from '../metrics/metrics-collector';
import type { LoggerOptions } from '../options/options';
import type { LoggerWithRedactor, Redactor } from '../redactor/redactor';
import { attachRedactor } from '../redactor/redactor';
import type { PinoSinkOptions } from '../sink/pino/pino-sink.options';
import {
	createSinkForEnvironment,
	type LoggerWithSink,
	type Sink,
	type SinkOptions,
} from '../sink/sink';
import { SinkDecorator } from '../sink/sink.decorator';

/**
 * Opções para criação de logger composto
 * Usa LoggerOptions como base para evitar duplicação
 */
export interface ComposedLoggerOptions extends LoggerOptions {
	/**
	 * Sink para redirecionar logs
	 * Se não fornecido, tentará criar PinoSink, fallback para ConsoleSink
	 */
	sink?: Sink;

	/**
	 * Redactor para sanitizar dados sensíveis
	 */
	redactor?: Redactor;

	/**
	 * Habilitar coleta de métricas
	 */
	enableMetrics?: boolean;

	/**
	 * Opções do sink Pino quando usado como default
	 */
	pino?: PinoSinkOptions;

	/**
	 * Opções de enriquecimento do sink
	 */
	sinkOptions?: SinkOptions;
}

/**
 * Tipos utilitários para composição condicional
 */
type WithMetrics<C extends ComposedLoggerOptions> = C extends { enableMetrics: true }
	? LoggerWithMetrics
	: unknown;

type WithSink<C extends ComposedLoggerOptions> = C extends { sink: Sink }
	? LoggerWithSink
	: unknown;

type WithRedactor<C extends ComposedLoggerOptions> = C extends { redactor: Redactor }
	? LoggerWithRedactor
	: unknown;

/**
 * Tipo composto inferido baseado nas opções fornecidas
 */
export type ComposedLogger<C extends ComposedLoggerOptions> = Logger &
	WithMetrics<C> &
	WithSink<C> &
	WithRedactor<C>;

/**
 * Factory para criar loggers compostos com funcionalidades opcionais
 * Logger orquestra metrics + redactor + sink, delega escrita final para sink
 * Separação clara: dev=console, prod=pino, futuro=winston
 *
 * @param options - Opções de configuração para o logger composto
 * @returns Logger configurado com as funcionalidades solicitadas e tipos inferidos
 * @example
 * ```typescript
 * // Logger básico (sink baseado em ambiente)
 * const logger = createComposedLogger();
 *
 * // Logger com métricas
 * const logger = createComposedLogger({ enableMetrics: true });
 *
 * // Logger completo com redactor
 * const logger = createComposedLogger({
 *   redactor: createRedactor({ keys: ['password', 'token'] }),
 *   enableMetrics: true
 * });
 *
 * // Logger com sink customizado
 * const logger = createComposedLogger({
 *   sink: customSink,
 *   enableMetrics: true
 * });
 *
 * await logger.info('User created', { userId: '123' });
 * ```
 */
export function createComposedLogger<C extends ComposedLoggerOptions = {}>(
	options?: C
): ComposedLogger<C> {
	// Validação fail-fast
	if (options !== undefined && options !== null && typeof options !== 'object') {
		throw new Error('createComposedLogger: options deve ser um objeto válido, null ou undefined');
	}

	// 1. Criar sink baseado em ambiente ou usar fornecido
	let baseSink: Sink;
	if (options?.sink) {
		baseSink = options.sink;
	} else {
		// Factory decide sink baseado em ambiente
		const environment =
			options?.sinkOptions?.environment || process.env['NODE_ENV'] || 'development';
		try {
			baseSink = createSinkForEnvironment(environment, options?.sinkOptions);
		} catch (error) {
			throw new Error(
				`createComposedLogger: Falha ao criar sink para ambiente '${environment}'. Erro: ${error}`
			);
		}
	}

	// Fail-fast: validar sink criado
	if (!baseSink) {
		throw new Error('createComposedLogger: sink é obrigatório e não pôde ser criado');
	}

	// 2. Decorar sink com enriquecimento se necessário
	const sink = new SinkDecorator(baseSink, {
		service: options?.sinkOptions?.service,
		environment: options?.sinkOptions?.environment,
		version: options?.sinkOptions?.version,
		fields: options?.sinkOptions?.fields,
	});

	// 3. Criar logger temporário para metrics se necessário
	let metricsLogger: LoggerWithMetrics | undefined;
	if (options?.enableMetrics) {
		// Criar um logger temporário que será substituído pelo ComposedLogger
		const tempLogger = {
			info: async () => {},
			error: async () => {},
			warn: async () => {},
			debug: async () => {},
			trace: async () => {},
			fatal: async () => {},
			withFields: () => tempLogger,
			withCorrelationId: () => tempLogger,
			flush: async () => {},
			close: async () => {},
		} as Logger;

		// Usar MetricsCollector avançado
		const metricsCollector = new MetricsCollector();
		metricsLogger = attachMetrics(tempLogger, metricsCollector);
	}

	// 4. Criar logger composto que orquestra tudo
	const logger = new ComposedLoggerClass(
		sink,
		metricsLogger,
		options?.redactor ? attachRedactor({} as Logger, options.redactor) : undefined,
		options?.fields || {}
	);

	return logger as any;
}
