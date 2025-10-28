import type { LogEntry } from '../../logger/logger';
import type { Sink } from '../sink';

/**
 * Implementação simples de Sink usando console nativo
 * Fallback explícito quando Pino não está disponível
 * Sem dependências externas, sempre disponível
 *
 * @example
 * ```typescript
 * const sink = new ConsoleSinkAdapter();
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
export class ConsoleSinkAdapter implements Sink {
	/**
	 * Escreve uma entrada de log no console
	 * @param entry - A entrada de log para escrever
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
	write(entry: LogEntry): void {
		const message = this.formatMessage(entry);
		const fields = this.formatFields(entry);

		// Usar console apropriado baseado no nível
		switch (entry.level) {
			case 'trace':
			case 'debug':
				console.log(`[${(entry.level as string).toUpperCase()}] ${message}`, fields);
				break;
			case 'info':
				console.log(`[INFO] ${message}`, fields);
				break;
			case 'warn':
				console.warn(`[WARN] ${message}`, fields);
				break;
			case 'error':
			case 'fatal':
				console.error(`[${(entry.level as string).toUpperCase()}] ${message}`, fields);
				break;
			default:
				console.log(`[${(entry.level as string).toUpperCase()}] ${message}`, fields);
		}
	}

	/**
	 * Força o flush de logs pendentes
	 * No-op para console (síncrono)
	 */
	flush(): void {
		// Console é síncrono, não há flush necessário
	}

	/**
	 * Fecha o sink e limpa recursos
	 * No-op para console
	 */
	close(): void {
		// Console não precisa de cleanup
	}

	/**
	 * Formatação de mensagem baseada no scope
	 * @param entry - A entrada de log
	 * @returns Mensagem formatada
	 */
	private formatMessage(entry: LogEntry): string {
		const className = entry.scope.className || '';
		const methodName = entry.scope.methodName;

		if (className) {
			return `${className}.${methodName}`;
		}

		return methodName;
	}

	/**
	 * Formata campos da entrada de log para exibição
	 * @param entry - A entrada de log
	 * @returns Campos formatados
	 */
	private formatFields(entry: LogEntry): Record<string, unknown> {
		const fields: Record<string, unknown> = {
			timestamp: entry.timestamp,
			outcome: entry.outcome,
			durationMs: entry.durationMs,
		};

		// Adicionar correlation ID se fornecido
		if (entry['correlationId']) {
			fields['correlationId'] = entry['correlationId'];
		}

		// Adicionar argumentos se fornecidos
		if (entry['args'] !== undefined) {
			fields['args'] = entry['args'];
		}

		// Adicionar resultado se fornecido
		if (entry['result'] !== undefined) {
			fields['result'] = entry['result'];
		}

		// Adicionar erro se fornecido
		if (entry['error']) {
			fields['error'] = entry['error'];
		}

		return fields;
	}
}
