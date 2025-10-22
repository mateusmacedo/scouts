import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { ensureCid, getCid, reqStore, runWithCid, runWithCidAsync } from './context';

// Mock do randomUUID para controle determinístico
jest.mock('node:crypto', () => ({
	randomUUID: jest.fn(() => 'mocked-uuid-123'),
}));

describe('Context Module', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('reqStore', () => {
		test('should be an instance of AsyncLocalStorage', () => {
			expect(reqStore).toBeInstanceOf(AsyncLocalStorage);
		});
	});

	describe('getCid', () => {
		test('should return undefined when no active context', () => {
			const cid = getCid();
			expect(cid).toBeUndefined();
		});

		test('should return correlation ID when active context exists', () => {
			const testCid = 'test-correlation-id';

			reqStore.run({ cid: testCid }, () => {
				const cid = getCid();
				expect(cid).toBe(testCid);
			});
		});

		test('should return undefined after exiting context', () => {
			const testCid = 'test-correlation-id';

			reqStore.run({ cid: testCid }, () => {
				// Inside context
				expect(getCid()).toBe(testCid);
			});

			// Outside context
			expect(getCid()).toBeUndefined();
		});
	});

	describe('ensureCid', () => {
		test('should return valid string when provided', () => {
			const validCid = 'valid-correlation-id';
			const result = ensureCid(validCid);
			expect(result).toBe(validCid);
		});

		test('should generate UUID when empty string is provided', () => {
			const result = ensureCid('');
			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});

		test('should generate UUID when string contains only spaces', () => {
			const result = ensureCid('   ');
			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});

		test('should generate UUID when undefined is provided', () => {
			const result = ensureCid();
			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});

		test('should generate UUID when array is provided (backward compatibility)', () => {
			const result = ensureCid(['cid1', 'cid2']);
			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});

		test('should generate UUID when empty array is provided', () => {
			const result = ensureCid([]);
			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});

		test('should normalize valid string with leading/trailing spaces (trim)', () => {
			const validCid = '  valid-cid  ';
			const result = ensureCid(validCid);
			expect(result).toBe('valid-cid'); // Trimmed
		});

		test('should reject invalid characters and generate UUID', () => {
			const invalidCid = 'invalid@#$%';
			const result = ensureCid(invalidCid);
			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});

		test('should truncate long CID to default maxLen (128)', () => {
			const longCid = 'a'.repeat(200);
			const result = ensureCid(longCid);
			expect(result).toBe('a'.repeat(128));
		});

		test('should reject control characters and generate UUID', () => {
			const controlChars = 'cid\nwith\r\ncontrol\tchars';
			const result = ensureCid(controlChars);
			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});
	});

	describe('runWithCid', () => {
		test('should execute function with provided CID', () => {
			const testCid = 'test-cid-123';
			const result = runWithCid(() => {
				return getCid();
			}, testCid);

			expect(result).toBe(testCid);
		});

		test('should generate CID when not provided', () => {
			const result = runWithCid(() => {
				return getCid();
			});

			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});

		test('should return function result', () => {
			const expectedResult = { data: 'test' };
			const result = runWithCid(() => expectedResult, 'test-cid');

			expect(result).toBe(expectedResult);
		});
	});

	describe('runWithCidAsync', () => {
		test('should execute async function with provided CID', async () => {
			const testCid = 'test-cid-456';
			const result = await runWithCidAsync(async () => {
				return getCid();
			}, testCid);

			expect(result).toBe(testCid);
		});

		test('should generate CID when not provided', async () => {
			const result = await runWithCidAsync(async () => {
				return getCid();
			});

			expect(result).toBe('mocked-uuid-123');
			expect(randomUUID).toHaveBeenCalledTimes(1);
		});

		test('should return async function result', async () => {
			const expectedResult = { data: 'async-test' };
			const result = await runWithCidAsync(async () => expectedResult, 'test-cid');

			expect(result).toBe(expectedResult);
		});
	});

	describe('Concurrency and Isolation', () => {
		test('should maintain isolated CIDs in parallel executions', async () => {
			const seen: string[] = [];
			const worker = (cid: string) =>
				runWithCidAsync(async () => {
					await new Promise((r) => setTimeout(r, Math.random() * 30));
					seen.push(getCid()!);
				}, cid);

			await Promise.all([worker('A'), worker('B'), worker('C')]);
			expect(new Set(seen)).toEqual(new Set(['A', 'B', 'C']));
		});

		test('should preserve correct scope in nested contexts', () => {
			const results: string[] = [];

			runWithCid(() => {
				results.push(getCid()!); // Should be 'A'

				runWithCid(() => {
					results.push(getCid()!); // Should be 'B'
				}, 'B');

				results.push(getCid()!); // Should be 'A' again
			}, 'A');

			expect(results).toEqual(['A', 'B', 'A']);
		});

		test('should not leak context between sequential executions', () => {
			runWithCid(() => {
				expect(getCid()).toBe('first');
			}, 'first');

			// Outside context
			expect(getCid()).toBeUndefined();

			runWithCid(() => {
				expect(getCid()).toBe('second');
			}, 'second');
		});
	});

	describe('Charset and Security Validation', () => {
		test('should reject dangerous special characters', () => {
			const dangerousInputs = [
				'cid<script>alert(1)</script>',
				'cid${process.env.SECRET}',
				'cid; DROP TABLE users;',
				'cid\x00\x01\x02',
				'cid\u0000\u0001\u0002',
			];

			dangerousInputs.forEach((input) => {
				const result = ensureCid(input);
				expect(result).toBe('mocked-uuid-123');
			});
		});

		test('should accept valid characters from default charset', () => {
			const validInputs = [
				'valid-cid-123',
				'valid.cid.456',
				'valid_cid_789',
				'valid:cid:abc',
				'ValidCid123',
				'123456789',
			];

			validInputs.forEach((input) => {
				const result = ensureCid(input);
				expect(result).toBe(input);
			});
		});

		test('should support custom charset configuration', () => {
			const customCharset = /^[A-Z0-9]+$/;
			const result = ensureCid('VALID123', { charset: customCharset });
			expect(result).toBe('VALID123');

			const invalidResult = ensureCid('invalid-lowercase', { charset: customCharset });
			expect(invalidResult).toBe('mocked-uuid-123');
		});

		test('should support custom maxLen configuration', () => {
			const longCid = 'a'.repeat(200);
			const result = ensureCid(longCid, { maxLen: 50 });
			expect(result).toBe('a'.repeat(50));
		});
	});
});
