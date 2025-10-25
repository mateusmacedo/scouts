import { randomBytes } from 'node:crypto';
import 'reflect-metadata';
import { getCid } from '../context/context';
import type { LogEntry, LogLevel } from '../logger/logger';
import { DefaultRedactor } from '../redactor/default.redactor';
import type { Redactor } from '../redactor/redactor';
import { PinoSinkAdapter } from '../sink/pino/pino-sink.adapter';
import type { Sink } from '../sink/sink';

/**
 * Interface para opções do decorator Log
 */
export interface LogOptions {
	/**
	 * Nível de log para o método
	 */
	level?: LogLevel;

	/**
	 * Incluir argumentos do método no log
	 */
	includeArgs?: boolean;

	/**
	 * Incluir resultado do método no log
	 */
	includeResult?: boolean;

	/**
	 * Taxa de amostragem (0.0 a 1.0)
	 */
	sampleRate?: number;

	/**
	 * Redactor para dados sensíveis
	 */
	redact?: Redactor;

	/**
	 * Sink para escrita dos logs
	 */
	sink?: Sink;

	/**
	 * Função para obter correlation ID
	 */
	getCorrelationId?: () => string | undefined;
}

/**
 * Gera um número aleatório criptograficamente seguro entre 0 e 1
 * Usa crypto.randomBytes() ao invés de Math.random() para segurança
 */
const getSecureRandom = (): number => {
	const bytes = randomBytes(4);
	const value = bytes.readUInt32BE(0);
	return value / (0xffffffff + 1);
};

/**
 * Verifica se um valor é uma Promise
 */
const isPromise = (v: unknown): v is Promise<unknown> =>
	!!v && typeof v === 'object' && typeof (v as Promise<unknown>).then === 'function';

/**
 * Cria instâncias padrão de Sink e Redactor
 */
const createDefaults = () => {
	const defaultRedactor = new DefaultRedactor();

	const defaultSink = new PinoSinkAdapter(
		require('pino')({
			base: {
				service: process.env['SERVICE_NAME'] || 'logger-node',
				env: process.env['NODE_ENV'] || 'development',
				version: process.env['SERVICE_VERSION'] || '1.0.0',
			},
		})
	);

	return { defaultRedactor, defaultSink };
};

/**
 * Decorator funcional para logging automático de métodos
 * Intercepta execução, captura timing, args, resultado e erros
 * Compatível com NestJS - preserva metadados existentes
 *
 * @param opts - Opções de configuração para o logging
 * @returns Decorator function
 * @example
 * ```typescript
 * class UserService {
 *   @Log({
 *     level: 'info',
 *     includeArgs: true,
 *     includeResult: true,
 *     sampleRate: 1.0
 *   })
 *   async createUser(userData: CreateUserData): Promise<User> {
 *     return this.repository.create(userData);
 *   }
 * }
 * ```
 */
export function Log(opts: LogOptions = {}) {
	const {
		level = 'info',
		includeArgs = true,
		includeResult = false,
		sampleRate = 1,
		redact,
		sink,
		getCorrelationId = getCid,
	} = opts;

	// Criar defaults se não fornecidos
	const { defaultRedactor, defaultSink } = createDefaults();
	const finalRedactor = redact || defaultRedactor;
	const finalSink = sink || defaultSink;

	// Universal decorator que funciona com aplicações gerais e NestJS
	return (
		_target: object,
		propertyKey: string | symbol,
		descriptor: PropertyDescriptor
	): PropertyDescriptor | undefined => {
		// Lidar com caso onde descriptor é undefined (decorator de 2 argumentos)
		if (!descriptor) {
			return;
		}

		// Apenas modificar descriptors de função
		if (!descriptor.value || typeof descriptor.value !== 'function') {
			return descriptor;
		}

		const original = descriptor.value;

		// Criar novo descriptor que preserva todos os metadados para frameworks como NestJS
		const newDescriptor: PropertyDescriptor = {
			configurable: descriptor.configurable ?? true,
			enumerable: descriptor.enumerable ?? true,
			writable: descriptor.writable ?? true,
			value: function (...args: unknown[]) {
				// Aplicar sample rate se configurado
				if (sampleRate < 1 && getSecureRandom() > sampleRate) {
					return original.apply(this, args);
				}

				const className = (this as { constructor?: { name?: string } })?.constructor?.name;
				const methodName = String(propertyKey);
				const cid = getCorrelationId?.();

				const startTime = performance.now();
				const makeBase = (endTime: number) => {
					const timestamp = new Date().toISOString();
					return {
						timestamp: timestamp,
						level,
						scope: { className, methodName },
						correlationId: cid,
						durationMs: endTime - startTime,
					} as Omit<LogEntry, 'outcome'>;
				};

				try {
					const ret = original.apply(this, args);

					if (isPromise(ret)) {
						return ret
							.then(async (value) => {
								const endTime = performance.now();
								const entry: LogEntry = {
									...makeBase(endTime),
									outcome: 'success',
									...(includeArgs && {
										args: (await finalRedactor.redact(args)) as unknown[],
									}),
									...(includeResult && { result: await finalRedactor.redact(value) }),
								};
								finalSink.write(entry);
								return value;
							})
							.catch(async (err) => {
								const endTime = performance.now();
								const entry: LogEntry = {
									...makeBase(endTime),
									outcome: 'failure',
									...(includeArgs && {
										args: (await finalRedactor.redact(args)) as unknown[],
									}),
									error: {
										name: (err as Error)?.name ?? 'Error',
										message: String((err as Error)?.message ?? err),
										...((err as Error)?.stack && {
											stack: (err as Error).stack,
										}),
									},
								};
								finalSink.write(entry);
								throw err;
							});
					}

					// Método síncrono - fazer logging síncrono
					const endTime = performance.now();
					const entry: LogEntry = {
						...makeBase(endTime),
						outcome: 'success',
						...(includeArgs && {
							args: finalRedactor.redact(args) as unknown as unknown[],
						}),
						...(includeResult && {
							result: finalRedactor.redact(ret),
						}),
					};
					finalSink.write(entry);
					return ret;
				} catch (err: unknown) {
					const endTime = performance.now();
					const entry: LogEntry = {
						...makeBase(endTime),
						outcome: 'failure',
						...(includeArgs && {
							args: finalRedactor.redact(args) as unknown as unknown[],
						}),
						error: {
							name: (err as Error)?.name ?? 'Error',
							message: String((err as Error)?.message ?? err),
							...((err as Error)?.stack && { stack: (err as Error).stack }),
						},
					};
					finalSink.write(entry);
					throw err;
				}
			},
		};

		// Preservar todos os metadados existentes e retornar o descriptor aprimorado
		return newDescriptor;
	};
}

/**
 * Decorator de conveniência para logging de nível info
 * @example
 * ```typescript
 * @LogInfo({ includeArgs: true })
 * async createUser(userData: CreateUserData) {
 *   // ...
 * }
 * ```
 */
export function LogInfo(options: Omit<LogOptions, 'level'> = {}) {
	return Log({ ...options, level: 'info' });
}

/**
 * Decorator de conveniência para logging de nível debug
 * @example
 * ```typescript
 * @LogDebug({ includeArgs: true, includeResult: true })
 * async processData(data: any) {
 *   // ...
 * }
 * ```
 */
export function LogDebug(options: Omit<LogOptions, 'level'> = {}) {
	return Log({ ...options, level: 'debug' });
}

/**
 * Decorator de conveniência para logging de nível warn
 * @example
 * ```typescript
 * @LogWarn({ includeArgs: true })
 * async validateInput(input: any) {
 *   // ...
 * }
 * ```
 */
export function LogWarn(options: Omit<LogOptions, 'level'> = {}) {
	return Log({ ...options, level: 'warn' });
}

/**
 * Decorator de conveniência para logging de nível error
 * @example
 * ```typescript
 * @LogError({ includeArgs: true, includeResult: true })
 * async handleError(error: Error) {
 *   // ...
 * }
 * ```
 */
export function LogError(options: Omit<LogOptions, 'level'> = {}) {
	return Log({ ...options, level: 'error' });
}
