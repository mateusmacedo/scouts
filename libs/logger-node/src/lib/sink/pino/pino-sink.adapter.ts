import type { LogEntry } from '../../logger/logger';
import type { Sink } from '../sink';
import { LogBuffer } from './log-buffer';
import type { PinoLike, PinoSinkOptions } from './pino-sink.options';
import { ProcessHandlerManager } from './process-handler';

/**
 * Implementação do Sink usando Pino como thin adapter
 * Delega para Pino nativo sem implementar buffering custom
 * Usa recursos nativos do Pino para buffering e performance
 *
 * @example
 * ```typescript
 * const pino = require('pino');
 * const logger = pino({ level: 'info' });
 * const sink = new PinoSinkAdapter(logger);
 *
 * await sink.write({
 *   level: 'info',
 *   timestamp: '2023-01-01T00:00:00.000Z',
 *   scope: { className: 'UserService', methodName: 'createUser' },
 *   outcome: 'success',
 *   durationMs: 150,
 *   result: { userId: '123' }
 * });
 * ```
 */
export class PinoSinkAdapter implements Sink {
	private readonly logger: PinoLike;
	private readonly messageFormat: (entry: LogEntry) => string;
	private buffer?: LogBuffer;
	private processHandler: ProcessHandlerManager;
	private readonly enableBackpressure: boolean;

	/**
	 * Cria uma nova instância do PinoSinkAdapter
	 * @param logger - Instância do Pino (obrigatória, fail-fast)
	 * @param messageFormat - Função de formatação de mensagem (opcional)
	 * @throws Error se logger inválido for fornecido
	 */
	constructor(
		logger: PinoLike,
		messageFormat?: (entry: LogEntry) => string,
		options?: PinoSinkOptions
	) {
		// Validação fail-fast
		if (!logger || typeof logger !== 'object') {
			throw new Error(
				'PinoSinkAdapter: logger é obrigatório e deve ser uma instância válida do Pino'
			);
		}

		// Validar métodos obrigatórios do PinoLike
		const requiredMethods = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
		for (const method of requiredMethods) {
			if (typeof (logger as Record<string, unknown>)[method] !== 'function') {
				throw new Error(`PinoSinkAdapter: logger deve implementar método '${method}'`);
			}
		}

		this.logger = logger;
		this.messageFormat = messageFormat || this.defaultMessageFormat;
		this.enableBackpressure = options?.enableBackpressure || false;

		// Inicializar process handler
		this.processHandler = ProcessHandlerManager.getInstance();
		this.processHandler.registerSink(this);

		// Inicializar buffer se configurado
		if (options?.bufferSize && options.bufferSize > 0) {
			this.buffer = new LogBuffer(
				options.bufferSize,
				options.flushInterval || 5000,
				this.flushBuffer.bind(this)
			);
			this.processHandler.registerBuffer(this.buffer);
		}
	}

	/**
	 * Escreve uma entrada de log no sink
	 * @param entry - A entrada de log para escrever
	 * @throws Error se escrita falhar
	 * @example
	 * ```typescript
	 * sink.write({
	 *   level: 'info',
	 *   timestamp: '2023-01-01T00:00:00.000Z',
	 *   scope: { className: 'UserService', methodName: 'createUser' },
	 *   outcome: 'success',
	 *   durationMs: 150,
	 *   result: { userId: '123' }
	 * });
	 * ```
	 */
	async write(entry: LogEntry): Promise<void> {
		// Se buffer está ativo, usar buffer
		if (this.buffer) {
			const added = await this.buffer.add(entry);

			// Se buffer cheio e backpressure habilitado, escrever diretamente
			if (!added && this.enableBackpressure) {
				await this.writeDirect(entry);
			}
		} else {
			// Sem buffer, escrever diretamente
			await this.writeDirect(entry);
		}
	}

	/**
	 * Escreve diretamente no logger (sem buffer)
	 */
	private writeDirect(entry: LogEntry): void {
		const level = entry.level;
		const message = this.messageFormat(entry);
		const fields = this.formatFields(entry);

		this.logger[level](fields, message);
	}

	/**
	 * Força o flush de logs pendentes
	 * @returns Promise que resolve quando flush está completo
	 * @example
	 * ```typescript
	 * await sink.flush(); // Garante que todos os logs são escritos antes de continuar
	 * ```
	 */
	async flush(): Promise<void> {
		// Flush buffer se ativo
		if (this.buffer) {
			await this.buffer.flush();
		}

		// Flush logger nativo
		if (this.logger.flush) {
			this.logger.flush();
		}
	}

	/**
	 * Fecha o sink e limpa recursos
	 * @returns Promise que resolve quando cleanup está completo
	 * @example
	 * ```typescript
	 * await sink.close(); // Shutdown limpo
	 * ```
	 */
	async close(): Promise<void> {
		// Flush antes de fechar
		await this.flush();

		// Fechar buffer se ativo
		if (this.buffer) {
			await this.buffer.close();
			this.processHandler.unregisterBuffer(this.buffer);
		}

		// Unregister do process handler
		this.processHandler.unregisterSink(this);
	}

	/**
	 * Callback para flush do buffer
	 */
	private async flushBuffer(entries: LogEntry[]): Promise<void> {
		for (const entry of entries) {
			await this.writeDirect(entry);
		}
	}

	/**
	 * Obtém estatísticas do buffer
	 */
	getBufferStats(): {
		hasBuffer: boolean;
		stats?: {
			count: number;
			capacity: number;
			utilization: number;
			isFlushing: boolean;
		};
	} {
		if (!this.buffer) {
			return { hasBuffer: false };
		}

		return {
			hasBuffer: true,
			stats: this.buffer.getStats(),
		};
	}

	/**
	 * Formatação padrão de mensagem baseada no scope
	 * @param entry - A entrada de log
	 * @returns Mensagem formatada
	 */
	private defaultMessageFormat(entry: LogEntry): string {
		const className = entry.scope.className || '';
		const methodName = entry.scope.methodName;

		if (className) {
			return `${className}.${methodName}`;
		}

		return methodName;
	}

	/**
	 * Formata campos da entrada de log para o formato Pino
	 * @param entry - A entrada de log
	 * @returns Campos formatados para Pino
	 */
	private formatFields(entry: LogEntry): Record<string, unknown> {
		const fields: Record<string, unknown> = {
			correlationId: entry.correlationId,
			durationMs: entry.durationMs,
			outcome: entry.outcome,
		};

		// Adicionar argumentos se fornecidos
		if (entry.args !== undefined) {
			fields['args'] = entry.args;
		}

		// Adicionar resultado se fornecido
		if (entry.result !== undefined) {
			fields['result'] = entry.result;
		}

		// Adicionar erro se fornecido
		if (entry.error) {
			fields['error'] = entry.error;
		}

		return fields;
	}
}
