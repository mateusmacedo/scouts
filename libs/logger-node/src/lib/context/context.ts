import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

/**
 * Options for CID generation and validation
 */
export interface EnsureOpts {
	/** Maximum length for correlation ID (default: 128) */
	maxLen?: number;
	/** Character set validation regex (default: alphanumeric + ._:-) */
	charset?: RegExp;
	/** ID generator type (default: 'uuid') */
	generator?: 'uuid' | 'ulid';
}

/**
 * AsyncLocalStorage instance for storing correlation IDs across async operations
 * Provides request-scoped correlation ID tracking for distributed logging
 */
export const reqStore = new AsyncLocalStorage<{ cid: string }>();

/**
 * Gets the current correlation ID from the async context
 * @returns The current correlation ID or undefined if not set
 * @example
 * ```typescript
 * const cid = getCid(); // Returns current correlation ID
 * ```
 */
export const getCid = (): string | undefined => reqStore.getStore()?.cid;

/**
 * Runs a function with a correlation ID context
 * @param fn - Function to execute within the context
 * @param cid - Optional correlation ID (will be generated if not provided)
 * @returns The result of the function execution
 * @example
 * ```typescript
 * const result = runWithCid(() => {
 *   return getCid(); // Returns the CID set for this context
 * }, 'my-cid');
 * ```
 */
export function runWithCid<T>(fn: () => T, cid?: string): T {
	const value = { cid: ensureCid(cid) };
	return reqStore.run(value, fn);
}

/**
 * Runs an async function with a correlation ID context
 * @param fn - Async function to execute within the context
 * @param cid - Optional correlation ID (will be generated if not provided)
 * @returns Promise resolving to the result of the function execution
 * @example
 * ```typescript
 * const result = await runWithCidAsync(async () => {
 *   return getCid(); // Returns the CID set for this context
 * }, 'my-cid');
 * ```
 */
export async function runWithCidAsync<T>(fn: () => Promise<T>, cid?: string): Promise<T> {
	const value = { cid: ensureCid(cid) };
	return await reqStore.run(value, fn);
}

/**
 * Ensures a valid correlation ID is available with secure normalization
 * @param incoming - Optional incoming correlation ID (string, array, or undefined)
 * @param opts - Options for validation and generation
 * @returns A valid correlation ID string
 * @example
 * ```typescript
 * const cid = ensureCid('req-123'); // Returns 'req-123'
 * const cid2 = ensureCid(); // Returns new UUID
 * const cid3 = ensureCid('  valid-cid  '); // Returns 'valid-cid' (trimmed)
 * const cid4 = ensureCid('invalid@#$'); // Returns new UUID (invalid chars)
 * ```
 */
export const ensureCid = (incoming?: string | string[], opts: EnsureOpts = {}): string => {
	const { maxLen = 128, charset = /^[A-Za-z0-9._:-]+$/, generator = 'uuid' } = opts;

	const makeId = () => {
		if (generator === 'ulid') {
			try {
				// Dynamic import to avoid breaking if ulid is not installed
				const { ulid } = require('ulid');
				return ulid();
			} catch {
				return randomUUID();
			}
		}
		return randomUUID();
	};

	let raw = '';
	if (!Array.isArray(incoming) && typeof incoming === 'string') {
		raw = incoming;
	}
	if (!raw?.trim()) return makeId();

	const normalized = raw.trim().slice(0, maxLen);
	return charset.test(normalized) ? normalized : makeId();
};

/**
 * OpenTelemetry Bridge Interface
 *
 * When OpenTelemetry is available, this function should be called to set
 * the correlation ID as a span attribute for distributed tracing.
 *
 * Example implementation:
 * ```typescript
 * import { trace } from '@opentelemetry/api';
 *
 * export function setCidInSpan(cid: string): void {
 *   const span = trace.getActiveSpan();
 *   if (span) {
 *     span.setAttribute('correlation.id', cid);
 *   }
 * }
 * ```
 */
// fake value to change and force affected files
