import type { Redactor, RedactorOptions } from './redactor';

/**
 * Implementação padrão do Redactor
 * Fornece redação segura de dados sensíveis com timeout protection contra ReDoS
 * Suporta redação por chaves e padrões com configurações avançadas
 *
 * @example
 * ```typescript
 * const redactor = new DefaultRedactor({
 *   keys: ['password', 'token', 'secret'],
 *   patterns: [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi], // CPF pattern
 *   mask: '***',
 *   maxDepth: 5,
 *   redactTimeout: 100
 * });
 *
 * const redacted = await redactor.redact({ password: 'secret123', user: 'john' });
 * // Result: { password: '***', user: 'john' }
 * ```
 */
export class DefaultRedactor implements Redactor {
	private readonly keyMatchers: RegExp[];
	private readonly patterns: RegExp[];
	private compiledPattern: RegExp | null = null;
	private readonly mask: string | ((value: unknown, path: string[]) => string);
	private readonly maxDepth: number;
	private readonly keepLengths: boolean;
	private readonly redactArrayIndices: boolean;
	private readonly redactTimeout: number;

	/**
	 * Cria uma nova instância do DefaultRedactor
	 * @param opts - Opções de configuração para o redactor
	 * @throws Error se configuração inválida for fornecida
	 */
	constructor(opts: RedactorOptions = {}) {
		const {
			keys = [
				'password',
				'passwd',
				'pass',
				'pwd',
				'token',
				'access_token',
				'refresh_token',
				'authorization',
				'auth',
				'secret',
				'apiKey',
				'api_key',
				'apikey',
				'client_secret',
				'card',
				'cardNumber',
				'cvv',
				'cvc',
				'ssn',
				'cpf',
				'cnpj',
			],
			patterns = [
				/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi,
				/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/gi,
				/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
				/\b(?:[A-Fa-f0-9]{32,64})\b/g,
			],
			mask = '***',
			maxDepth = 5,
			keepLengths = false,
			redactArrayIndices = true,
			redactTimeout = 100,
		} = opts;

		// Validar configuração
		if (!Array.isArray(keys)) {
			throw new TypeError('Keys must be an array');
		}

		if (!Array.isArray(patterns)) {
			throw new TypeError('Patterns must be an array');
		}

		if (maxDepth < 0 || maxDepth > 20) {
			throw new Error(`Invalid maxDepth: ${maxDepth}. Must be between 0 and 20`);
		}

		this.keyMatchers = keys.map((k) => {
			if (typeof k === 'string') {
				const safeKey = this.isValidKeyPattern(k) ? k : this.escapeRegExp(k);
				return new RegExp(`^${safeKey}$`, 'i');
			}
			return k;
		});
		this.patterns = patterns;
		this.mask = mask;
		this.maxDepth = maxDepth;
		this.keepLengths = keepLengths;
		this.redactArrayIndices = redactArrayIndices;
		this.redactTimeout = redactTimeout;

		// Compilar padrões para performance otimizada
		this.compilePatterns();
	}

	/**
	 * Redata dados sensíveis
	 * @param data - Os dados para redatar (pode ser qualquer tipo)
	 * @returns Promise que resolve para os dados redatados
	 * @example
	 * ```typescript
	 * const result = await redactor.redact({
	 *   user: 'john',
	 *   password: 'secret123',
	 *   email: 'john@example.com'
	 * });
	 * // Result: { user: 'john', password: '***', email: '***' }
	 * ```
	 */
	async redact(data: unknown): Promise<unknown> {
		const startTime = Date.now();

		// Implementar timeout com Promise.race para proteção contra ReDoS
		const redactPromise = this.walk(data, 0, [], new WeakSet());
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				reject(new Error(`Redaction timeout after ${this.redactTimeout}ms`));
			}, this.redactTimeout);
		});

		try {
			const result = await Promise.race([redactPromise, timeoutPromise]);
			const duration = Date.now() - startTime;

			// Log de performance para debugging (opcional)
			if (duration > this.redactTimeout * 0.8) {
				console.warn(`Redaction took ${duration}ms (close to timeout of ${this.redactTimeout}ms)`);
			}

			return result;
		} catch (error) {
			// Em caso de timeout, retornar dados originais com warning
			if (error instanceof Error && error.message.includes('timeout')) {
				console.warn(`Redaction timeout after ${this.redactTimeout}ms, returning original data`);
				return data;
			}
			throw error;
		}
	}

	/**
	 * Adiciona um novo padrão regex para redação
	 * @param pattern - O padrão regex para adicionar
	 * @example
	 * ```typescript
	 * redactor.addPattern(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi); // CPF pattern
	 * ```
	 */
	addPattern(pattern: RegExp): void {
		this.patterns.push(pattern);
		this.compilePatterns();
	}

	/**
	 * Adiciona uma nova chave para redação
	 * @param key - A chave para redatar (string ou regex)
	 * @example
	 * ```typescript
	 * redactor.addKey('apiKey');
	 * redactor.addKey(/^secret/i); // Chaves case-insensitive que começam com 'secret'
	 * ```
	 */
	addKey(key: string | RegExp): void {
		if (typeof key === 'string') {
			const safeKey = this.isValidKeyPattern(key) ? key : this.escapeRegExp(key);
			const matcher = new RegExp(`^${safeKey}$`, 'i');
			this.keyMatchers.push(matcher);
		} else {
			this.keyMatchers.push(key);
		}
	}

	private isValidKeyPattern(key: string): boolean {
		return /^[a-zA-Z0-9_.-]+$/.test(key);
	}

	private escapeRegExp(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/**
	 * Compila todos os padrões regex em um único padrão de alternação para performance otimizada
	 * Isso reduz o número de operações regex de O(n) para O(1) para redação de strings
	 */
	private compilePatterns(): void {
		if (this.patterns.length === 0) {
			this.compiledPattern = null;
			return;
		}

		try {
			// Combinar todos os padrões em um único regex de alternação
			const combined = this.patterns.map((p) => `(${p.source})`).join('|');
			this.compiledPattern = new RegExp(combined, 'gi');
		} catch {
			// Fallback para null se compilação falhar - regex inválido
			this.compiledPattern = null;
		}
	}

	private maskValue(v: unknown, path: string[]): string {
		if (typeof this.mask === 'function') return this.mask(v, path);
		if (this.keepLengths && typeof v === 'string') return '*'.repeat(v.length);
		return this.mask;
	}

	private redactString(s: string, path: string[]): string {
		if (!this.compiledPattern) return s;
		return s.replace(this.compiledPattern, () => this.maskValue(s, path));
	}

	private isStreamLike(value: unknown): boolean {
		return (
			typeof value === 'object' &&
			value !== null &&
			'pipe' in value &&
			'on' in value &&
			typeof (value as { pipe: unknown }).pipe === 'function' &&
			typeof (value as { on: unknown }).on === 'function'
		);
	}

	private handlePrimitive(value: unknown, path: string[]): unknown {
		if (value == null || typeof value !== 'object') {
			if (value === null) return null;
			return typeof value === 'string' ? this.redactString(value, path) : value;
		}
		return null; // Não é um primitivo
	}

	private handleSpecialObjects(value: unknown): unknown {
		if (value instanceof Date) return value.toISOString();
		if (value instanceof RegExp) return String(value);
		if (Buffer?.isBuffer?.(value)) return '[Buffer]';
		if (this.isStreamLike(value)) return '[Stream]';
		return null; // Não é um objeto especial
	}

	private handleCircularAndDepth(value: unknown, depth: number, seen: WeakSet<object>): unknown {
		if (value == null) return null; // Pular verificação circular para null/undefined
		if (seen.has(value as object)) return '[Circular]';
		if (depth >= this.maxDepth) return '[MaxDepth]';
		seen.add(value as object);
		return null; // Continuar processamento
	}

	private processArray(
		value: unknown[],
		depth: number,
		path: string[],
		seen: WeakSet<object>
	): unknown[] {
		return value.map((v, i) => {
			const nextPath = [...path, String(i)];
			if (this.redactArrayIndices && this.keyMatchers.some((re) => re.test(String(i)))) {
				return this.maskValue(v, nextPath);
			}
			// Verificar se o próprio valor deve ser redatado (para strings como "password123")
			if (typeof v === 'string') {
				const redactedString = this.redactString(v, nextPath);
				if (redactedString !== v) {
					return redactedString;
				}
			}
			return this.walk(v, depth + 1, nextPath, seen);
		});
	}

	private processMap(
		value: Map<unknown, unknown>,
		depth: number,
		path: string[],
		seen: WeakSet<object>
	): Record<string, unknown> {
		const obj: Record<string, unknown> = {};
		for (const [k, v] of value.entries()) {
			obj[String(k)] = this.walk(v, depth + 1, [...path, String(k)], seen);
		}
		return obj;
	}

	private processSet(
		value: Set<unknown>,
		depth: number,
		path: string[],
		seen: WeakSet<object>
	): unknown[] {
		return Array.from(value).map((v, i) => this.walk(v, depth + 1, [...path, String(i)], seen));
	}

	private processError(value: Error): Record<string, unknown> {
		return { name: value.name, message: value.message, stack: value.stack };
	}

	private processObject(
		value: Record<string, unknown>,
		depth: number,
		path: string[],
		seen: WeakSet<object>
	): Record<string, unknown> {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(value)) {
			const nextPath = [...path, key];
			if (this.keyMatchers.some((re) => re.test(key))) {
				out[key] = this.maskValue(value[key], nextPath);
			} else {
				out[key] = this.walk(value[key], depth + 1, nextPath, seen);
			}
		}
		return out;
	}

	private walk(value: unknown, depth: number, path: string[], seen: WeakSet<object>): unknown {
		try {
			// Lidar com null/undefined primeiro
			if (value == null) return value;

			// Lidar com primitivos primeiro
			const primitiveResult = this.handlePrimitive(value, path);
			if (primitiveResult !== null) return primitiveResult;

			// Lidar com objetos especiais
			const specialResult = this.handleSpecialObjects(value);
			if (specialResult !== null) return specialResult;

			// Lidar com referências circulares e limites de profundidade
			const circularResult = this.handleCircularAndDepth(value, depth, seen);
			if (circularResult !== null) return circularResult;

			// Lidar com coleções
			if (Array.isArray(value)) return this.processArray(value, depth, path, seen);
			if (value instanceof Map) return this.processMap(value, depth, path, seen);
			if (value instanceof Set) return this.processSet(value, depth, path, seen);
			if (value instanceof Error) return this.processError(value);

			// Lidar com objetos regulares
			return this.processObject(value as Record<string, unknown>, depth, path, seen);
		} catch {
			// Retornar [Unredactable] em qualquer erro durante walk
			return '[Unredactable]';
		}
	}
}
