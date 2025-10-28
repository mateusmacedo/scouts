/**
 * Utilitário de retry com exponential backoff
 * Baseado no draft logger com melhorias para integração
 */
export interface RetryOptions {
	/**
	 * Número máximo de tentativas (incluindo a primeira)
	 * Padrão: 3
	 */
	maxAttempts?: number;

	/**
	 * Delay inicial em milissegundos
	 * Padrão: 100ms
	 */
	initialDelay?: number;

	/**
	 * Multiplicador para exponential backoff
	 * Padrão: 2
	 */
	backoffMultiplier?: number;

	/**
	 * Delay máximo em milissegundos
	 * Padrão: 1000ms
	 */
	maxDelay?: number;

	/**
	 * Jitter para randomizar delays e evitar thundering herd
	 * Padrão: 0.1 (10%)
	 */
	jitter?: number;

	/**
	 * Função para determinar se um erro deve ser retentado
	 * Padrão: retry em todos os erros
	 */
	shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RetryResult<T> {
	success: boolean;
	result?: T;
	error?: unknown;
	attempts: number;
	totalDelay: number;
}

/**
 * Executa uma função com retry e exponential backoff
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<RetryResult<T>> {
	const {
		maxAttempts = 3,
		initialDelay = 100,
		backoffMultiplier = 2,
		maxDelay = 1000,
		jitter = 0.1,
		shouldRetry = () => true,
	} = options;

	let lastError: unknown;
	let totalDelay = 0;
	let attempt = 0;

	for (attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const result = await fn();
			return {
				success: true,
				result,
				attempts: attempt,
				totalDelay,
			};
		} catch (error) {
			lastError = error;

			// Se não deve retentar ou é a última tentativa
			if (!shouldRetry(error, attempt) || attempt === maxAttempts) {
				break;
			}

			// Calcular delay com exponential backoff
			const baseDelay = Math.min(initialDelay * backoffMultiplier ** (attempt - 1), maxDelay);

			// Adicionar jitter para randomizar
			const jitterAmount = baseDelay * jitter * (Math.random() * 2 - 1);
			const delay = Math.max(0, baseDelay + jitterAmount);

			totalDelay += delay;

			// Aguardar antes da próxima tentativa
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	return {
		success: false,
		error: lastError,
		attempts: attempt,
		totalDelay,
	};
}

/**
 * Cria uma função wrapper que aplica retry automaticamente
 */
export function createRetryWrapper<T extends (...args: unknown[]) => Promise<unknown>>(
	fn: T,
	options: RetryOptions = {}
): T {
	return (async (...args: Parameters<T>) => {
		const result = await withRetry(() => fn(...args), options);

		if (!result.success) {
			throw result.error;
		}

		return result.result;
	}) as T;
}

/**
 * Utilitário para retry com fallback
 */
export async function withRetryAndFallback<T>(
	fn: () => Promise<T>,
	fallback: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const result = await withRetry(fn, options);

	if (result.success) {
		return result.result as T;
	}

	// Se retry falhou, usar fallback
	return await fallback();
}

/**
 * Configurações pré-definidas de retry
 */
export const RetryPresets = {
	/**
	 * Retry rápido para operações críticas
	 */
	fast: {
		maxAttempts: 3,
		initialDelay: 50,
		backoffMultiplier: 2,
		maxDelay: 200,
		jitter: 0.1,
	},

	/**
	 * Retry padrão para operações normais
	 */
	standard: {
		maxAttempts: 3,
		initialDelay: 100,
		backoffMultiplier: 2,
		maxDelay: 1000,
		jitter: 0.1,
	},

	/**
	 * Retry lento para operações não críticas
	 */
	slow: {
		maxAttempts: 5,
		initialDelay: 200,
		backoffMultiplier: 2,
		maxDelay: 2000,
		jitter: 0.2,
	},

	/**
	 * Retry agressivo para operações críticas
	 */
	aggressive: {
		maxAttempts: 5,
		initialDelay: 50,
		backoffMultiplier: 1.5,
		maxDelay: 500,
		jitter: 0.05,
	},
} as const;
