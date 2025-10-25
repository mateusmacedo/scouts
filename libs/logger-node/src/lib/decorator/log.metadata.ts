import 'reflect-metadata';
import type { LogLevel } from '../logger/logger';

/**
 * Chave única para metadados de logging
 * Usa Symbol para evitar colisões com outros decorators
 */
export const LOG_META_KEY = Symbol('logger-node:log');

/**
 * Interface para metadados de logging (DEPRECATED)
 * @deprecated Use LogOptions from log.decorator.ts instead
 */
export interface LogMetadata {
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
}

/**
 * Copia todos os metadados de um objeto para outro
 * Preserva metadados existentes de outros decorators (NestJS, etc)
 *
 * @param from - Objeto fonte dos metadados
 * @param to - Objeto destino dos metadados
 */
export function copyOwnMetadata(from: object, to: object): void {
	const keys = Reflect.getOwnMetadataKeys(from);
	for (const key of keys) {
		const value = Reflect.getOwnMetadata(key, from);
		Reflect.defineMetadata(key, value, to);
	}
}

/**
 * Preserva metadados de método ao envolver com wrapper
 * Útil para manter compatibilidade com NestJS
 *
 * @param targetProto - Protótipo do target
 * @param methodName - Nome do método
 * @param original - Função original
 * @param wrapper - Função wrapper
 * @returns Função wrapper com metadados preservados
 */
export function preserveMethodMetadata<T extends (...args: unknown[]) => unknown>(
	targetProto: object,
	methodName: string | symbol,
	original: T,
	wrapper: T
): T {
	// Copiar metadados do método original para o wrapper
	copyOwnMetadata(original, wrapper);

	// Re-emitir chaves de design metadata (comuns no NestJS/TS)
	const ptypes = Reflect.getOwnMetadata('design:paramtypes', targetProto, methodName);
	const rtype = Reflect.getOwnMetadata('design:returntype', targetProto, methodName);
	const ttype = Reflect.getOwnMetadata('design:type', targetProto, methodName);

	if (ptypes) Reflect.defineMetadata('design:paramtypes', ptypes, targetProto, methodName);
	if (rtype) Reflect.defineMetadata('design:returntype', rtype, targetProto, methodName);
	if (ttype) Reflect.defineMetadata('design:type', ttype, targetProto, methodName);

	return wrapper;
}

/**
 * Lê metadados de logging de um método
 *
 * @param target - Target do decorator
 * @param propertyKey - Chave da propriedade
 * @returns Metadados de logging ou undefined
 */
export function getLogMetadata(
	target: object,
	propertyKey?: string | symbol
): LogMetadata | undefined {
	return propertyKey
		? Reflect.getMetadata(LOG_META_KEY, target, propertyKey)
		: Reflect.getMetadata(LOG_META_KEY, target);
}

/**
 * Define metadados de logging em um método
 *
 * @param target - Target do decorator
 * @param propertyKey - Chave da propriedade
 * @param metadata - Metadados de logging
 */
export function setLogMetadata(
	target: object,
	propertyKey: string | symbol,
	metadata: LogMetadata
): void {
	Reflect.defineMetadata(LOG_META_KEY, metadata, target, propertyKey);
}
