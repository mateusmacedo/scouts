import type { LoggerWithMetrics } from '../metrics/metrics';
import type { LoggerWithRedactor } from '../redactor/redactor';
import type { Sink } from '../sink/sink';

/**
 * Níveis de log disponíveis
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Estrutura de uma entrada de log
 */
export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	scope: { className?: string; methodName: string };
	outcome: 'success' | 'failure';
	args?: unknown[];
	result?: unknown;
	error?: { name: string; message: string; stack?: string };
	correlationId?: string;
	durationMs: number;
}

/**
 * Interface básica para loggers
 * Estabelece contratos e abstrações para logging
 */
export interface Logger {
	trace(message: string, fields?: Record<string, unknown>): void | Promise<void>;
	debug(message: string, fields?: Record<string, unknown>): void | Promise<void>;
	info(message: string, fields?: Record<string, unknown>): void | Promise<void>;
	warn(message: string, fields?: Record<string, unknown>): void | Promise<void>;
	error(message: string, fields?: Record<string, unknown>): void | Promise<void>;
	fatal(message: string, fields?: Record<string, unknown>): void | Promise<void>;
	withFields(fields: Record<string, unknown>): Logger;
	withCorrelationId(cid: string): Logger;
	flush(): void | Promise<void>;
	close(): void | Promise<void>;
	getMetrics?(): any;
	getRedactor?(): any;
}

/**
 * Logger composto que orquestra metrics + redactor + sink
 * Estabelece contratos e abstrações, delega escrita final para sink
 */
export class ComposedLogger implements Logger {
	constructor(
		private readonly sink: Sink,
		private readonly metrics?: LoggerWithMetrics,
		private readonly redactor?: LoggerWithRedactor,
		private readonly baseFields: Record<string, unknown> = {}
	) {
		// Validação fail-fast
		this.validateConfig();
	}

	/**
	 * Valida configuração do logger no constructor
	 * Fail-fast: throw se configuração inválida
	 */
	private validateConfig(): void {
		if (!this.sink) {
			throw new Error('ComposedLogger: sink é obrigatório');
		}

		if (this.sink && typeof this.sink.write !== 'function') {
			throw new Error('ComposedLogger: sink deve implementar método write()');
		}

		if (this.metrics && typeof this.metrics.getMetrics !== 'function') {
			throw new Error('ComposedLogger: metrics deve implementar método getMetrics()');
		}

		if (this.redactor && typeof this.redactor.redactor?.redact !== 'function') {
			throw new Error('ComposedLogger: redactor deve implementar método redact()');
		}

		if (this.baseFields && typeof this.baseFields !== 'object') {
			throw new Error('ComposedLogger: baseFields deve ser um objeto');
		}
	}

	/**
	 * Valida entrada do método log()
	 * Fail-fast: throw se entrada inválida
	 */
	private validateLogInput(level: string, message: string, fields?: Record<string, unknown>): void {
		if (!message || typeof message !== 'string' || message.trim() === '') {
			throw new Error('ComposedLogger: message é obrigatório e deve ser uma string não vazia');
		}

		if (!level || typeof level !== 'string') {
			throw new Error('ComposedLogger: level é obrigatório e deve ser uma string');
		}

		const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
		if (!validLevels.includes(level)) {
			throw new Error(
				`ComposedLogger: level '${level}' é inválido. Use: ${validLevels.join(', ')}`
			);
		}

		if (fields !== undefined && (typeof fields !== 'object' || fields === null)) {
			throw new Error('ComposedLogger: fields deve ser um objeto ou undefined');
		}
	}

	trace(message: string, fields?: Record<string, unknown>): void | Promise<void> {
		return this.log('trace', message, fields);
	}

	debug(message: string, fields?: Record<string, unknown>): void | Promise<void> {
		return this.log('debug', message, fields);
	}

	info(message: string, fields?: Record<string, unknown>): void | Promise<void> {
		return this.log('info', message, fields);
	}

	warn(message: string, fields?: Record<string, unknown>): void | Promise<void> {
		return this.log('warn', message, fields);
	}

	error(message: string, fields?: Record<string, unknown>): void | Promise<void> {
		return this.log('error', message, fields);
	}

	fatal(message: string, fields?: Record<string, unknown>): void | Promise<void> {
		return this.log('fatal', message, fields);
	}

	withFields(fields: Record<string, unknown>): Logger {
		return new ComposedLogger(this.sink, this.metrics, this.redactor, {
			...this.baseFields,
			...fields,
		});
	}

	withCorrelationId(cid: string): Logger {
		return new ComposedLogger(this.sink, this.metrics, this.redactor, {
			...this.baseFields,
			correlationId: cid,
		});
	}

	flush(): void | Promise<void> {
		return this.sink.flush();
	}

	close(): void | Promise<void> {
		return this.sink.close();
	}

	/**
	 * Expõe métricas se disponível
	 */
	getMetrics() {
		if (this.metrics && typeof (this.metrics as any).getMetrics === 'function') {
			return (this.metrics as any).getMetrics();
		}
		return undefined;
	}

	// Propriedades para compatibilidade com testes
	public getSink() {
		return this.sink;
	}

	public getRedactor() {
		// Se redactor é um LoggerWithRedactor (Proxy), acessar a propriedade redactor
		if (this.redactor && typeof this.redactor === 'object' && 'redactor' in this.redactor) {
			return (this.redactor as any).redactor;
		}
		// Se redactor é um Proxy que expõe redactor diretamente
		if (
			this.redactor &&
			typeof this.redactor === 'object' &&
			typeof (this.redactor as any).redactor !== 'undefined'
		) {
			return (this.redactor as any).redactor;
		}
		return this.redactor;
	}

	/**
	 * Orquestra o pipeline: metrics -> redactor -> sink
	 * Logger central coordena tudo e delega escrita final para sink
	 */
	private async log(
		level: string,
		message: string,
		fields?: Record<string, unknown>
	): Promise<void> {
		// Validação de entrada
		this.validateLogInput(level, message, fields);

		const startTime = Date.now();
		const allFields = { ...this.baseFields, ...fields };

		try {
			// 1. Aplicar metrics se habilitado
			if (this.metrics && typeof (this.metrics as any)[level] === 'function') {
				(this.metrics as any)[level](message, allFields);
			}

			// 2. Aplicar redactor se fornecido
			let processedFields = allFields;
			if (this.redactor) {
				const redacted = this.redactor.redactor.redact(allFields);
				processedFields = redacted as unknown as Record<string, unknown>;
			}

			// 3. Criar entrada de log final
			const logEntry: LogEntry = {
				timestamp: new Date().toISOString(),
				level: level as any,
				scope: { methodName: level },
				outcome: 'success',
				durationMs: Date.now() - startTime,
				args: [message, processedFields],
				...(this.baseFields['correlationId']
					? { correlationId: this.baseFields['correlationId'] as string }
					: {}),
			};

			// 4. Delegar escrita final para sink
			await this.sink.write(logEntry);
		} catch (error) {
			// Em caso de erro, criar entrada de log de erro
			const logEntry: LogEntry = {
				timestamp: new Date().toISOString(),
				level: level as any,
				scope: { methodName: level },
				outcome: 'failure',
				durationMs: Date.now() - startTime,
				args: [message, allFields],
				error: {
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
				},
				...(this.baseFields['correlationId']
					? { correlationId: this.baseFields['correlationId'] as string }
					: {}),
			};

			await this.sink.write(logEntry);
			throw error;
		}
	}
}
