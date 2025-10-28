import type { Logger } from '../logger/logger';

/**
 * Interface para configuração de redactor
 */
export interface RedactorOptions {
	/**
	 * Chaves para redação
	 */
	keys?: (string | RegExp)[];

	/**
	 * Padrões regex para redação
	 */
	patterns?: RegExp[];

	/**
	 * Máscara para valores redatados
	 */
	mask?: string | ((value: unknown, path: string[]) => string);

	/**
	 * Profundidade máxima de redação
	 */
	maxDepth?: number;

	/**
	 * Manter comprimento dos valores redatados
	 */
	keepLengths?: boolean;

	/**
	 * Redatar índices de array
	 */
	redactArrayIndices?: boolean;

	/**
	 * Timeout para operações de redação em milissegundos (proteção contra ReDoS)
	 * Padrão: 100ms
	 */
	redactTimeout?: number;
}

/**
 * Interface para redação de dados sensíveis
 * Permite implementar diferentes estratégias de redação
 */
export interface Redactor {
	/**
	 * Redata dados sensíveis
	 */
	redact(data: unknown): Promise<unknown>;

	/**
	 * Adiciona um novo padrão de redação
	 */
	addPattern(pattern: RegExp): void;

	/**
	 * Adiciona uma nova chave para redação
	 */
	addKey(key: string | RegExp): void;
}

/**
 * Interface para logger com redator acoplado
 */
export interface LoggerWithRedactor {
	redactor: Redactor;
}

/**
 * Acopla um redator a um Logger existente via Proxy,
 * sem intrusão no algoritmo principal.
 *
 * - Não cria estado global.
 * - Não depende de implementação específica de logger.
 * - Intercepta métodos de logging para aplicar redação.
 * - Expõe redactor no logger retornado.
 */
export function attachRedactor<L extends Logger>(
	logger: L,
	redactor: Redactor
): L & LoggerWithRedactor {
	const handler: ProxyHandler<L> = {
		get(target, prop, receiver) {
			// Expor redactor diretamente no proxy.
			if (prop === 'redactor') {
				return redactor;
			}

			const orig = Reflect.get(target, prop, receiver);

			// Se for um método de logging, aplicamos redação.
			if (typeof prop === 'string' && isLogMethod(prop) && typeof orig === 'function') {
				return async (...args: unknown[]) => {
					try {
						// Aplicar redação nos argumentos antes de chamar o método original
						const redactedArgs = await Promise.all(
							args.map(async (arg) => {
								if (arg && typeof arg === 'object') {
									return await redactor.redact(arg);
								}
								return arg;
							})
						);

						const result = orig.apply(target, redactedArgs);

						// Se o resultado for uma Promise, aplicar redação também
						if (isPromiseLike(result)) {
							return result.then(async (val) => {
								if (val && typeof val === 'object') {
									return await redactor.redact(val);
								}
								return val;
							});
						} else {
							// Resultado síncrono
							if (result && typeof result === 'object') {
								return await redactor.redact(result);
							}
							return result;
						}
					} catch (err) {
						// Logging estruturado direto no logger (bypass redactor para evitar recursão)
						const errorContext = {
							method: String(prop),
							argsCount: args.length,
							errorType: err instanceof Error ? err.constructor.name : typeof err,
							message: err instanceof Error ? err.message : String(err),
						};

						// Log direto no target (sem proxy) para evitar recursão
						if (typeof target.error === 'function') {
							target.error('Redaction error in logger method', errorContext);
						}

						// Enriquecer erro com contexto antes de re-throw
						if (err instanceof Error) {
							err.message = `[Redactor@${String(prop)}] ${err.message}`;
						}

						throw err;
					}
				};
			}

			// Acesso normal caso não seja um método interceptado.
			return orig;
		},
	};

	return new Proxy(logger, handler) as L & LoggerWithRedactor;
}

/**
 * Lista de métodos candidatos a logging
 */
const LOG_METHODS: readonly string[] = [
	'fatal',
	'error',
	'warn',
	'info',
	'debug',
	'trace',
	'log',
] as const;

/**
 * Verifica se o método é um método de logging
 */
function isLogMethod(method: string): boolean {
	return LOG_METHODS.includes(method);
}

/**
 * Interface para detectar objetos tipo Promise
 */
interface PromiseLike {
	then: unknown;
	catch: unknown;
}

/**
 * Predicado utilitário para detectar Promises sem comprometer type-safety.
 */
function isPromiseLike<T = unknown>(val: unknown): val is Promise<T> {
	return (
		!!val &&
		typeof (val as PromiseLike).then === 'function' &&
		typeof (val as PromiseLike).catch === 'function'
	);
}
