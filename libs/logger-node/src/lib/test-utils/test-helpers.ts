import type { Logger } from '../logger/logger';
import type { LogEntry } from '../logger/logger';

/**
 * Utilitários para testes do logger
 * Baseado no draft logger com melhorias para integração
 */
export interface TestLoggerOptions {
	/**
	 * Capturar logs em memória para verificação
	 * Padrão: true
	 */
	captureLogs?: boolean;

	/**
	 * Nível de log mínimo para captura
	 * Padrão: 'trace'
	 */
	minLevel?: string;

	/**
	 * Incluir timestamps nos logs capturados
	 * Padrão: false
	 */
	includeTimestamps?: boolean;
}

export interface CapturedLog {
	level: string;
	message: string;
	fields?: Record<string, unknown>;
	timestamp?: string;
}

/**
 * Cria um logger de teste que captura logs em memória
 */
export function createTestLogger(options: TestLoggerOptions = {}): {
	logger: Logger;
	capturedLogs: CapturedLog[];
	clearLogs: () => void;
	getLogsByLevel: (level: string) => CapturedLog[];
	getLastLog: () => CapturedLog | undefined;
} {
	const { captureLogs = true, minLevel = 'trace', includeTimestamps = false } = options;

	const capturedLogs: CapturedLog[] = [];
	const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
	const minLevelIndex = levels.indexOf(minLevel);

	const createLogMethod = (level: string, levelIndex: number) => {
		return (message: string, fields?: Record<string, unknown>) => {
			if (captureLogs && levelIndex >= minLevelIndex) {
				const log: CapturedLog = {
					level,
					message,
					fields,
				};

				if (includeTimestamps) {
					log.timestamp = new Date().toISOString();
				}

				capturedLogs.push(log);
			}
		};
	};

	const logger = {
		trace: createLogMethod('trace', 0),
		debug: createLogMethod('debug', 1),
		info: createLogMethod('info', 2),
		warn: createLogMethod('warn', 3),
		error: createLogMethod('error', 4),
		fatal: createLogMethod('fatal', 5),
		child: (fields: Record<string, unknown>) => createTestLogger(options).logger,
		withFields: (fields: Record<string, unknown>) => createTestLogger(options).logger,
		withCorrelationId: (correlationId: string) => createTestLogger(options).logger,
		flush: () => Promise.resolve(),
		close: () => Promise.resolve(),
	} as Logger;

	return {
		logger,
		capturedLogs,
		clearLogs: () => (capturedLogs.length = 0),
		getLogsByLevel: (level: string) => capturedLogs.filter((log) => log.level === level),
		getLastLog: () => capturedLogs[capturedLogs.length - 1],
	};
}

/**
 * Cria um mock de LogEntry para testes
 */
export function createMockLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
	return {
		timestamp: '2023-01-01T00:00:00.000Z',
		level: 'info',
		scope: { className: 'TestClass', methodName: 'testMethod' },
		outcome: 'success',
		durationMs: 100,
		args: ['Test message'],
		...overrides,
	};
}

/**
 * Utilitário para aguardar logs específicos
 */
export function waitForLog(
	capturedLogs: CapturedLog[],
	predicate: (log: CapturedLog) => boolean,
	timeout: number = 1000
): Promise<CapturedLog> {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const checkLogs = () => {
			const matchingLog = capturedLogs.find(predicate);
			if (matchingLog) {
				resolve(matchingLog);
				return;
			}

			if (Date.now() - startTime > timeout) {
				reject(new Error(`Timeout waiting for log. Timeout: ${timeout}ms`));
				return;
			}

			setTimeout(checkLogs, 10);
		};

		checkLogs();
	});
}

/**
 * Utilitário para aguardar múltiplos logs
 */
export function waitForLogs(
	capturedLogs: CapturedLog[],
	count: number,
	predicate?: (log: CapturedLog) => boolean,
	timeout: number = 1000
): Promise<CapturedLog[]> {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const checkLogs = () => {
			const matchingLogs = predicate ? capturedLogs.filter(predicate) : capturedLogs;

			if (matchingLogs.length >= count) {
				resolve(matchingLogs.slice(0, count));
				return;
			}

			if (Date.now() - startTime > timeout) {
				reject(
					new Error(
						`Timeout waiting for ${count} logs. Found: ${matchingLogs.length}. Timeout: ${timeout}ms`
					)
				);
				return;
			}

			setTimeout(checkLogs, 10);
		};

		checkLogs();
	});
}

/**
 * Utilitário para verificar se logs contêm campos específicos
 */
export function logsContain(capturedLogs: CapturedLog[], field: string, value: unknown): boolean {
	return capturedLogs.some((log) => log.fields && log.fields[field] === value);
}

/**
 * Utilitário para verificar se logs contêm mensagem específica
 */
export function logsContainMessage(capturedLogs: CapturedLog[], message: string): boolean {
	return capturedLogs.some((log) => log.message.includes(message));
}

/**
 * Utilitário para verificar se logs contêm nível específico
 */
export function logsContainLevel(capturedLogs: CapturedLog[], level: string): boolean {
	return capturedLogs.some((log) => log.level === level);
}

/**
 * Utilitário para limpar logs entre testes
 */
export function setupTestEnvironment(): {
	originalConsoleLog: typeof console.log;
	originalConsoleError: typeof console.error;
	originalConsoleWarn: typeof console.warn;
	restoreConsole: () => void;
} {
	const originalConsoleLog = console.log;
	const originalConsoleError = console.error;
	const originalConsoleWarn = console.warn;

	// Mock console methods to prevent test output
	console.log = (() => {}) as any;
	console.error = (() => {}) as any;
	console.warn = (() => {}) as any;

	return {
		originalConsoleLog,
		originalConsoleError,
		originalConsoleWarn,
		restoreConsole: () => {
			console.log = originalConsoleLog;
			console.error = originalConsoleError;
			console.warn = originalConsoleWarn;
		},
	};
}
