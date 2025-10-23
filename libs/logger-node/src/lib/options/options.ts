import type { LogLevel } from '../logger/logger';

/**
 * Opções base para enriquecimento de logs
 * Campos comuns para service, environment, version
 */
export interface BaseEnrichmentOptions {
	/**
	 * Nome do serviço
	 */
	service?: string;

	/**
	 * Ambiente (development, production, test)
	 */
	environment?: string;

	/**
	 * Versão do serviço
	 */
	version?: string;

	/**
	 * Campos adicionais para enriquecimento
	 */
	fields?: Record<string, unknown>;
}

/**
 * Opções para criação de logger base
 * Focado apenas em configurações do logger, não do sink
 */
export interface LoggerOptions extends BaseEnrichmentOptions {
	/**
	 * Nível de log padrão
	 */
	level?: LogLevel;

	/**
	 * Função para obter correlation ID
	 */
	getCorrelationId?: () => string | undefined;
}

/**
 * Opções para decorators de log
 */
export interface LogOptions {
	level?: LogLevel;
	includeArgs?: boolean;
	includeResult?: boolean;
	sampleRate?: number;
	getCorrelationId?: () => string | undefined;
	includeStackTrace?: boolean;
}
// fake value to change and force affected files
