import type { Redactor } from './redactor';
import { createRedactor } from './redactor.factory';

describe('createRedactor', () => {
	describe('Factory Function', () => {
		it('should_create_redactor_with_default_options', () => {
			// Arrange & Act
			const redactor = createRedactor();

			// Assert
			expect(redactor).toBeDefined();
			expect(typeof redactor.redact).toBe('function');
			expect(typeof redactor.addPattern).toBe('function');
			expect(typeof redactor.addKey).toBe('function');
		});

		it('should_create_redactor_with_custom_options', () => {
			// Arrange
			const options = {
				keys: ['customPassword'],
				patterns: [/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g],
				mask: '[CUSTOM_MASK]',
				maxDepth: 10,
				redactTimeout: 200,
			};

			// Act
			const redactor = createRedactor(options);

			// Assert
			expect(redactor).toBeDefined();
			expect(redactor).toBeInstanceOf(Object);
		});

		it('should_create_redactor_with_partial_options', () => {
			// Arrange
			const options = {
				mask: '[PARTIAL_MASK]',
				maxDepth: 3,
			};

			// Act
			const redactor = createRedactor(options);

			// Assert
			expect(redactor).toBeDefined();
		});

		it('should_create_redactor_with_empty_options', () => {
			// Arrange
			const options = {};

			// Act
			const redactor = createRedactor(options);

			// Assert
			expect(redactor).toBeDefined();
		});

		it('should_create_redactor_with_undefined_options', () => {
			// Arrange & Act
			const redactor = createRedactor();

			// Assert
			expect(redactor).toBeDefined();
		});
	});

	describe('Redactor Functionality', () => {
		let redactor: Redactor;

		beforeEach(() => {
			redactor = createRedactor();
		});

		it('should_redact_sensitive_data_correctly', async () => {
			// Arrange
			const input = { user: 'john', password: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', password: '***' });
		});

		it('should_add_patterns_dynamically', () => {
			// Arrange
			const pattern = /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g;

			// Act
			redactor.addPattern(pattern);

			// Assert
			expect(() => redactor.addPattern(pattern)).not.toThrow();
		});

		it('should_add_keys_dynamically', () => {
			// Arrange
			const key = 'customSecret';

			// Act
			redactor.addKey(key);

			// Assert
			expect(() => redactor.addKey(key)).not.toThrow();
		});
	});

	describe('Configuration Validation', () => {
		it('should_throw_error_for_invalid_options', () => {
			// Arrange
			const invalidOptions = {
				redactTimeout: 0, // Invalid timeout
				maxDepth: -1, // Invalid depth
			};

			// Act & Assert
			expect(() => createRedactor(invalidOptions)).toThrow();
		});

		it('should_throw_error_for_invalid_keys_type', () => {
			// Arrange
			const invalidOptions = {
				keys: 'invalid' as any,
			};

			// Act & Assert
			expect(() => createRedactor(invalidOptions)).toThrow('Keys must be an array');
		});

		it('should_throw_error_for_invalid_patterns_type', () => {
			// Arrange
			const invalidOptions = {
				patterns: 'invalid' as any,
			};

			// Act & Assert
			expect(() => createRedactor(invalidOptions)).toThrow('Patterns must be an array');
		});
	});

	describe('Custom Mask Functions', () => {
		it('should_work_with_custom_mask_function', async () => {
			// Arrange
			const customMask = (value: unknown, path: string[]) => `[MASKED_${path.join('_')}]`;
			const redactor = createRedactor({ mask: customMask });
			const input = { password: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ password: '[MASKED_password]' });
		});

		it('should_work_with_keepLengths_option', async () => {
			// Arrange
			const redactor = createRedactor({ keepLengths: true });
			const input = { password: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ password: '*********' }); // 9 asterisks for 9 characters
		});
	});

	describe('Edge Cases', () => {
		it('should_handle_null_input', async () => {
			// Arrange
			const redactor = createRedactor();

			// Act
			const result = await redactor.redact(null);

			// Assert
			expect(result).toBeNull();
		});

		it('should_handle_undefined_input', async () => {
			// Arrange
			const redactor = createRedactor();

			// Act
			const result = await redactor.redact(undefined);

			// Assert
			expect(result).toBeUndefined();
		});

		it('should_handle_primitive_inputs', async () => {
			// Arrange
			const redactor = createRedactor();
			const inputs = ['string', 123, true, false];

			// Act & Assert
			for (const input of inputs) {
				const result = await redactor.redact(input);
				expect(result).toBe(input);
			}
		});
	});
});
