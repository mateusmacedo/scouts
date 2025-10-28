import { DefaultRedactor } from './default.redactor';
import type { Redactor, RedactorOptions } from './redactor';

/**
 * Factory para criar instâncias de Redactor configuradas
 * Fornece uma API simples para criar redactors com configurações padrão ou customizadas
 *
 * @param options - Opções de configuração para o redactor
 * @returns Uma instância configurada do Redactor
 * @example
 * ```typescript
 * // Redactor com configurações padrão
 * const redactor = createRedactor();
 *
 * // Redactor com configurações customizadas
 * const redactor = createRedactor({
 *   keys: ['password', 'token', 'apiKey'],
 *   patterns: [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi],
 *   mask: '[REDACTED]',
 *   maxDepth: 10,
 *   redactTimeout: 200
 * });
 *
 * const result = await redactor.redact({ password: 'secret', user: 'john' });
 * // Result: { password: '[REDACTED]', user: 'john' }
 * ```
 */
export function createRedactor(options?: RedactorOptions): Redactor {
	return new DefaultRedactor(options);
}
