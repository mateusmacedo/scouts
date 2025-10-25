import type { LogEntry } from '../../logger/logger';
import type { SinkOptions } from '../sink';

/**
 * Interface para configuração do PinoSink
 * Estende SinkOptions com opções específicas do Pino
 * Remove duplicação: service, environment, version, fields já estão em SinkOptions
 */
export interface PinoSinkOptions extends SinkOptions {
	/**
	 * Instância do Pino para injeção (testes/mocking)
	 * Se não fornecido, será criada uma instância usando loggerOptions
	 */
	logger?: PinoLike;

	/**
	 * Opções nativas do Pino - buffering via destination/extreme
	 */
	loggerOptions?: {
		/**
		 * Nível de log do Pino
		 */
		level?: string;

		/**
		 * Campos base para todos os logs
		 */
		base?: object;

		/**
		 * Stream de destino do Pino (buffering nativo)
		 */
		destination?: any; // pino.DestinationStream

		/**
		 * Modo síncrono (true) ou assíncrono com buffer (false)
		 */
		sync?: boolean;

		/**
		 * Modo de performance extrema com buffer maior
		 */
		extreme?: boolean;

		/**
		 * Outras opções do Pino
		 */
		[key: string]: unknown;
	};

	/**
	 * Formatação customizada de LogEntry para mensagem
	 */
	messageFormat?: (entry: LogEntry) => string;

	/**
	 * Configurações de buffer circular
	 */
	bufferSize?: number;
	flushInterval?: number;
	enableBackpressure?: boolean;
}

/**
 * Tipo que representa uma instância do Pino ou mock compatível
 * Usado para injeção de dependência em testes
 */
export type PinoLike = {
	trace: (...args: unknown[]) => unknown;
	debug: (...args: unknown[]) => unknown;
	info: (...args: unknown[]) => unknown;
	warn: (...args: unknown[]) => unknown;
	error: (...args: unknown[]) => unknown;
	fatal: (...args: unknown[]) => unknown;
	flush?: () => void;
};
