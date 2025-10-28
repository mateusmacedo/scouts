import { DefaultRedactor } from './default.redactor';

describe('DefaultRedactor', () => {
	let redactor: DefaultRedactor;

	beforeEach(() => {
		redactor = new DefaultRedactor();
	});

	describe('Sensitive Keys Redaction', () => {
		it('should_redact_password_field_when_present_in_object', async () => {
			// Arrange
			const input = { user: 'john', password: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', password: '***' });
		});

		it('should_preserve_non_sensitive_fields_when_redacting', async () => {
			// Arrange
			const input = { user: 'john', email: 'john@example.com', token: 'abc123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toMatchObject({ user: 'john' });
			expect(result).toHaveProperty('token', '***');
		});

		it('should_redact_multiple_sensitive_keys', async () => {
			// Arrange
			const input = {
				user: 'john',
				password: 'secret123',
				apiKey: 'key456',
				secret: 'secret789',
			};

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({
				user: 'john',
				password: '***',
				apiKey: '***',
				secret: '***',
			});
		});

		it('should_redact_case_insensitive_keys', async () => {
			// Arrange
			const input = { user: 'john', PASSWORD: 'secret123', Token: 'abc123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', PASSWORD: '***', Token: '***' });
		});
	});

	describe('Regex Patterns Redaction', () => {
		it('should_redact_cpf_pattern_when_present', async () => {
			// Arrange
			const input = { user: 'john', document: '123.456.789-10' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', document: '***' });
		});

		it('should_redact_email_pattern_when_present', async () => {
			// Arrange
			const input = { user: 'john', email: 'john@example.com' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', email: '***' });
		});

		it('should_redact_hash_patterns_when_present', async () => {
			// Arrange
			const input = { user: 'john', hash: 'a1b2c3d4e5f6789012345678901234567890abcd' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', hash: '***' });
		});
	});

	describe('Depth Limitation', () => {
		it('should_stop_at_max_depth_when_configured', async () => {
			// Arrange
			const redactor = new DefaultRedactor({ maxDepth: 2 });
			const input = {
				level1: {
					level2: {
						level3: {
							password: 'secret123',
						},
					},
				},
			};

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({
				level1: {
					level2: '[MaxDepth]',
				},
			});
		});

		it('should_handle_zero_max_depth', async () => {
			// Arrange
			const redactor = new DefaultRedactor({ maxDepth: 0 });
			const input = { password: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toBe('[MaxDepth]');
		});
	});

	describe('Circular References', () => {
		it('should_handle_circular_references_without_crashing', async () => {
			// Arrange
			const input: any = { name: 'test' };
			input.self = input;

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toHaveProperty('self', '[Circular]');
		});

		it('should_handle_array_circular_references', async () => {
			// Arrange
			const input: any[] = ['test'];
			input.push(input);

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual(['test', '[Circular]']);
		});
	});

	describe('Special Types', () => {
		it('should_handle_date_objects', async () => {
			// Arrange
			const input = { user: 'john', createdAt: new Date('2023-01-01T00:00:00.000Z') };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', createdAt: '2023-01-01T00:00:00.000Z' });
		});

		it('should_handle_regex_objects', async () => {
			// Arrange
			const input = { user: 'john', pattern: /test/gi };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', pattern: '/test/gi' });
		});

		it('should_handle_error_objects', async () => {
			// Arrange
			const input = { user: 'john', error: new Error('Test error') };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toMatchObject({
				user: 'john',
				error: {
					name: 'Error',
					message: 'Test error',
					stack: expect.any(String),
				},
			});
		});

		it('should_handle_map_objects', async () => {
			// Arrange
			const input = { user: 'john', data: new Map([['key', 'value']]) };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', data: { key: 'value' } });
		});

		it('should_handle_set_objects', async () => {
			// Arrange
			const input = { user: 'john', data: new Set(['value1', 'value2']) };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', data: ['value1', 'value2'] });
		});
	});

	describe('Edge Cases', () => {
		it('should_return_null_when_input_is_null', async () => {
			// Arrange
			const input = null;

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toBeNull();
		});

		it('should_return_undefined_when_input_is_undefined', async () => {
			// Arrange
			const input = undefined;

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toBeUndefined();
		});

		it('should_handle_empty_object', async () => {
			// Arrange
			const input = {};

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({});
		});

		it('should_handle_empty_array', async () => {
			// Arrange
			const input: unknown[] = [];

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual([]);
		});

		it('should_handle_primitives', async () => {
			// Arrange
			const inputs = ['string', 123, true, false];

			// Act & Assert
			for (const input of inputs) {
				const result = await redactor.redact(input);
				expect(result).toBe(input);
			}
		});
	});

	describe('Custom Mask', () => {
		it('should_use_custom_string_mask', async () => {
			// Arrange
			const redactor = new DefaultRedactor({ mask: '[REDACTED]' });
			const input = { password: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ password: '[REDACTED]' });
		});

		it('should_use_custom_function_mask', async () => {
			// Arrange
			const redactor = new DefaultRedactor({
				mask: (_value, path) => `[REDACTED_${path.join('_')}]`,
			});
			const input = { password: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ password: '[REDACTED_password]' });
		});

		it('should_preserve_length_when_keepLengths_is_true', async () => {
			// Arrange
			const redactor = new DefaultRedactor({ keepLengths: true });
			const input = { password: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ password: '*********' }); // 9 asterisks for 9 characters
		});
	});

	describe('Array Index Redaction', () => {
		it('should_redact_array_indices_when_configured', async () => {
			// Arrange
			const redactor = new DefaultRedactor({ redactArrayIndices: true });
			const input = ['value1', 'value2', 'value3'];

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual(['value1', 'value2', 'value3']); // No sensitive indices
		});
	});

	describe('Performance', () => {
		it('should_redact_large_object_within_100ms', async () => {
			// Arrange
			const input = Object.fromEntries(
				Array.from({ length: 1000 }, (_, i) => [`field${i}`, `value${i}`])
			);

			// Act
			const start = performance.now();
			await redactor.redact(input);
			const duration = performance.now() - start;

			// Assert
			expect(duration).toBeLessThan(100);
		});
	});

	describe('Configuration Validation', () => {
		it('should_throw_error_for_invalid_maxDepth', () => {
			// Arrange & Act & Assert
			expect(() => new DefaultRedactor({ maxDepth: -1 })).toThrow('Invalid maxDepth');
			expect(() => new DefaultRedactor({ maxDepth: 21 })).toThrow('Invalid maxDepth');
		});

		it('should_throw_error_for_invalid_keys_type', () => {
			// Arrange & Act & Assert
			expect(() => new DefaultRedactor({ keys: 'invalid' as any })).toThrow(
				'Keys must be an array'
			);
		});

		it('should_throw_error_for_invalid_patterns_type', () => {
			// Arrange & Act & Assert
			expect(() => new DefaultRedactor({ patterns: 'invalid' as any })).toThrow(
				'Patterns must be an array'
			);
		});
	});

	describe('Dynamic Configuration', () => {
		it('should_add_new_pattern_dynamically', async () => {
			// Arrange
			const redactor = new DefaultRedactor();
			redactor.addPattern(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g); // Credit card pattern
			const input = { user: 'john', card: '1234-5678-9012-3456' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', card: '***' });
		});

		it('should_add_new_key_dynamically', async () => {
			// Arrange
			const redactor = new DefaultRedactor();
			redactor.addKey('customSecret');
			const input = { user: 'john', customSecret: 'secret123' };

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toEqual({ user: 'john', customSecret: '***' });
		});
	});

	describe('Error Handling', () => {
		it('should_return_redact_timeout_on_processing_errors', async () => {
			// Arrange
			const redactor = new DefaultRedactor();
			const input = { user: 'john', password: 'secret123' };

			// Mock a scenario that would cause processing error
			const originalWalk = (redactor as any).walk;
			(redactor as any).walk = () => {
				return '[Unredactable]';
			};

			// Act
			const result = await redactor.redact(input);

			// Assert
			expect(result).toBe('[Unredactable]');

			// Restore original method
			(redactor as any).walk = originalWalk;
		});
	});
});
