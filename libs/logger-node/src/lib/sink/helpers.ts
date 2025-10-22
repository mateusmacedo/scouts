import type { LogEntry } from '../logger/logger';

/**
 * Cria uma entrada de log estruturada
 * @param level - Nível do log
 * @param message - Mensagem do log
 * @param fields - Campos adicionais
 * @param startTime - Timestamp de início (opcional)
 * @returns Entrada de log estruturada
 */
export function createLogEntry(
	level: string,
	message: string,
	fields?: Record<string, unknown>,
	startTime?: number
): LogEntry {
	const now = Date.now();
	const timestamp = new Date(now).toISOString();
	const durationMs = startTime ? now - startTime : 0;

	return {
		timestamp,
		level: level as any,
		scope: { methodName: level },
		outcome: 'success',
		durationMs,
		args: [message, fields || {}],
	};
}

/**
 * Formata o scope de uma entrada de log
 * @param className - Nome da classe (opcional)
 * @param methodName - Nome do método
 * @returns Scope formatado
 */
export function formatScope(
	className?: string,
	methodName?: string
): { className?: string; methodName: string } {
	return {
		className,
		methodName: methodName || 'unknown',
	};
}

/**
 * Formata um erro para inclusão em log
 * @param error - Erro a ser formatado
 * @returns Erro formatado
 */
export function formatError(error: unknown): { name: string; message: string; stack?: string } {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
	}

	return {
		name: 'Error',
		message: String(error),
	};
}

/**
 * Enriquece campos de uma entrada de log
 * @param fields - Campos originais
 * @param enrichment - Campos de enriquecimento
 * @returns Campos enriquecidos
 */
export function enrichFields(
	fields: Record<string, unknown> = {},
	enrichment: Record<string, unknown> = {}
): Record<string, unknown> {
	return {
		...fields,
		...enrichment,
	};
}

/**
 * Valida se uma entrada de log é válida
 * @param entry - Entrada de log a ser validada
 * @returns true se válida, false caso contrário
 */
export function validateLogEntry(entry: unknown): entry is LogEntry {
	if (!entry || typeof entry !== 'object') {
		return false;
	}

	const logEntry = entry as LogEntry;

	// Validar campos obrigatórios
	if (!logEntry.timestamp || typeof logEntry.timestamp !== 'string') {
		return false;
	}

	if (!logEntry.level || typeof logEntry.level !== 'string') {
		return false;
	}

	if (!logEntry.scope || typeof logEntry.scope !== 'object') {
		return false;
	}

	if (!logEntry.outcome || typeof logEntry.outcome !== 'string') {
		return false;
	}

	if (typeof logEntry.durationMs !== 'number') {
		return false;
	}

	// Validar níveis válidos
	const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
	if (!validLevels.includes(logEntry.level)) {
		return false;
	}

	// Validar outcomes válidos
	const validOutcomes = ['success', 'failure'];
	if (!validOutcomes.includes(logEntry.outcome)) {
		return false;
	}

	return true;
}
