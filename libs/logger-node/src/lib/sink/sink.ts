import type { LogEntry, Logger } from '../logger/logger';
import type { BaseEnrichmentOptions } from '../options/options';

/**
 * Interface para configuração de sink
 * Estende BaseEnrichmentOptions para evitar duplicação
 */
export interface SinkOptions extends BaseEnrichmentOptions {
	// Herda service, environment, version, fields de BaseEnrichmentOptions
}

/**
 * Factory para criar sinks baseado em ambiente
 * Separação clara: dev=console, prod=pino, futuro=winston
 * Fail-fast: throw se sink não puder ser criado
 */
export function createSinkForEnvironment(
	environment: string = process.env['NODE_ENV'] || 'development',
	options?: SinkOptions
): Sink {
	switch (environment) {
		case 'production':
		case 'prod':
			try {
				const { createPinoSink } = require('./pino/pino-sink.factory');
				return createPinoSink(options);
			} catch (error) {
				console.warn(
					`createSinkForEnvironment: Pino não disponível em produção, usando ConsoleSink como fallback. Erro: ${error}`
				);
				return new (require('./console/console-sink.adapter').ConsoleSinkAdapter)();
			}

		case 'development':
		case 'dev':
		case 'test':
		default:
			return new (require('./console/console-sink.adapter').ConsoleSinkAdapter)();
	}
}

/**
 * Interface para destinos de log (sinks)
 * Permite implementar diferentes destinos (Pino, CloudWatch, etc.)
 */
export interface Sink {
	/**
	 * Escreve uma entrada de log
	 */
	write(entry: LogEntry): void | Promise<void>;

	/**
	 * Força o flush de logs pendentes
	 */
	flush(): void | Promise<void>;

	/**
	 * Fecha o sink e limpa recursos
	 */
	close(): void | Promise<void>;
}

/**
 * Interface para logger com sink acoplado
 */
export interface LoggerWithSink {
	sink: Sink;
}
