import type { Sink } from '../sink';
import type { PinoSinkOptions, PinoLike } from './pino-sink.options';
import { PinoSinkAdapter } from './pino-sink.adapter';

// Re-export PinoSinkAdapter for external use
export { PinoSinkAdapter } from './pino-sink.adapter';

/**
 * Factory para criar instâncias de PinoSink configuradas
 * Fail-fast: throw se Pino não disponível
 * Responsabilidade do consumidor fornecer fallback alternativo
 *
 * @param options - Opções de configuração para o sink
 * @returns Uma instância configurada do Sink usando Pino
 * @throws Error se Pino não estiver disponível ou configuração inválida
 * @example
 * ```typescript
 * // Sink com configurações padrão
 * const sink = createPinoSink();
 *
 * // Sink com configurações customizadas
 * const sink = createPinoSink({
 *   service: 'user-service',
 *   environment: 'production',
 *   loggerOptions: {
 *     level: 'info',
 *     extreme: true, // buffering nativo do Pino
 *   }
 * });
 *
 * // Sink com logger mockado para testes
 * const sink = createPinoSink({
 *   logger: mockPinoLogger
 * });
 * ```
 */
export function createPinoSink(options?: PinoSinkOptions): Sink {
	// Validação fail-fast - options são opcionais, mas se fornecidas devem ser válidas
	if (options !== undefined && options !== null && typeof options !== 'object') {
		throw new Error('createPinoSink: options deve ser um objeto válido, null ou undefined');
	}

	// Se logger já fornecido, validar e usar diretamente
	if (options?.logger) {
		validatePinoLike(options.logger);
		return new PinoSinkAdapter(options.logger, options.messageFormat);
	}

	// Fail-fast: tentar criar instância Pino nativa
	let pino: any;
	try {
		pino = require('pino');
	} catch (error) {
		throw new Error(
			`createPinoSink: Pino não está disponível. Instale com 'npm install pino'. Erro: ${error}`
		);
	}

	// Validar se pino é uma função (versão correta)
	if (typeof pino !== 'function') {
		throw new Error('createPinoSink: Pino importado não é uma função. Verifique a instalação.');
	}

	// Criar configuração do Pino
	const pinoConfig = {
		level: options?.loggerOptions?.level || 'info',
		base: {
			service: options?.service,
			env: options?.environment,
			version: options?.version,
			...options?.loggerOptions?.base,
		},
		...options?.loggerOptions,
	};

	// Criar instância do Pino
	let logger: PinoLike;
	try {
		logger = pino(pinoConfig);
	} catch (error) {
		throw new Error(
			`createPinoSink: Falha ao criar instância Pino. Configuração inválida: ${error}`
		);
	}

	// Validar logger criado
	validatePinoLike(logger);

	return new PinoSinkAdapter(logger, options?.messageFormat, options);
}

/**
 * Valida se um objeto implementa a interface PinoLike
 * Fail-fast: throw se inválido
 */
function validatePinoLike(logger: unknown): asserts logger is PinoLike {
	if (!logger || typeof logger !== 'object') {
		throw new Error('createPinoSink: logger deve ser um objeto');
	}

	const requiredMethods = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
	for (const method of requiredMethods) {
		if (typeof (logger as any)[method] !== 'function') {
			throw new Error(`createPinoSink: logger deve implementar método '${method}'`);
		}
	}
}
