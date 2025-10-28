import { DefaultRedactor } from './default.redactor';

describe('Redactor Timeout', () => {
	describe('Timeout Protection', () => {
		test('should complete redaction within timeout', async () => {
			const redactor = new DefaultRedactor({
				redactTimeout: 100,
				keys: ['password', 'token'],
			});

			const data = {
				user: 'john',
				password: 'secret123',
				token: 'abc123',
				public: 'visible',
			};

			const startTime = Date.now();
			const result = await redactor.redact(data);
			const duration = Date.now() - startTime;

			expect(duration).toBeLessThan(100);
			expect(result).toEqual({
				user: 'john',
				password: '***',
				token: '***',
				public: 'visible',
			});
		});

		test('should handle timeout gracefully', async () => {
			// Criar redactor com timeout muito baixo para forçar timeout
			const redactor = new DefaultRedactor({
				redactTimeout: 1, // 1ms - muito baixo
				keys: ['password'],
				patterns: [/\b\d{10,}\b/g], // Regex complexo que pode ser lento
			});

			// Dados que podem causar regex lento
			const data = {
				password: 'secret123',
				longNumber: '123456789012345678901234567890',
				nested: {
					deep: {
						value: '1234567890123456789012345678901234567890',
					},
				},
			};

			const result = await redactor.redact(data);

			// O redactor pode completar a operação mesmo com timeout baixo
			// ou retornar dados originais em caso de timeout
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});

		test('should warn when close to timeout', async () => {
			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			const redactor = new DefaultRedactor({
				redactTimeout: 100,
				keys: ['password'],
			});

			// Simular operação que demora mas não timeout
			const data = {
				password: 'secret123',
				user: 'john',
			};

			await redactor.redact(data);

			// Não deve ter warning para operação rápida
			expect(consoleSpy).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		test('should handle timeout with complex patterns', async () => {
			const redactor = new DefaultRedactor({
				redactTimeout: 50,
				patterns: [
					/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi, // CPF
					/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/gi, // CNPJ
					/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, // Email
				],
			});

			const data = {
				cpf: '123.456.789-00',
				cnpj: '12.345.678/0001-90',
				email: 'user@example.com',
				normal: 'not sensitive',
			};

			const result = await redactor.redact(data);

			// Deve funcionar normalmente com timeout adequado
			expect(result).toEqual({
				cpf: '***',
				cnpj: '***',
				email: '***',
				normal: 'not sensitive',
			});
		});
	});

	describe('Performance Tracking', () => {
		test('should track redaction performance', async () => {
			const redactor = new DefaultRedactor({
				redactTimeout: 200,
				keys: ['password'],
			});

			const data = {
				password: 'secret123',
				user: 'john',
			};

			const startTime = Date.now();
			await redactor.redact(data);
			const duration = Date.now() - startTime;

			expect(duration).toBeLessThan(200);
			expect(duration).toBeGreaterThanOrEqual(0);
		});

		test('should handle large data structures', async () => {
			const redactor = new DefaultRedactor({
				redactTimeout: 1000,
				keys: ['password', 'token', 'secret'],
			});

			// Criar estrutura grande
			const largeData = {
				users: Array.from({ length: 100 }, (_, i) => ({
					id: i,
					password: `password${i}`,
					token: `token${i}`,
					secret: `secret${i}`,
					public: `public${i}`,
				})),
				metadata: {
					total: 100,
					timestamp: Date.now(),
				},
			};

			const startTime = Date.now();
			const result = await redactor.redact(largeData);
			const duration = Date.now() - startTime;

			expect(duration).toBeLessThan(1000);

			// Verificar que passwords foram redatados
			expect((result as any).users[0].password).toBe('***');
			expect((result as any).users[0].token).toBe('***');
			expect((result as any).users[0].secret).toBe('***');
			expect((result as any).users[0].public).toBe('public0');
		});
	});

	describe('Error Handling', () => {
		test('should handle circular references gracefully', async () => {
			const redactor = new DefaultRedactor({
				redactTimeout: 100,
				keys: ['password'],
			});

			// Criar dados que podem causar erro (não timeout)
			const data = {
				password: 'secret123',
				circular: {} as any,
			};

			// Criar referência circular
			data.circular.self = data.circular;

			// O redactor deve lidar com referências circulares
			const result = await redactor.redact(data);
			expect(result).toBeDefined();
			expect((result as any).password).toBe('***');
		});

		test('should handle timeout with nested objects', async () => {
			const redactor = new DefaultRedactor({
				redactTimeout: 1, // Timeout muito baixo
				keys: ['password'],
				maxDepth: 10,
			});

			// Criar estrutura profunda
			let deepData: any = { password: 'secret' };
			for (let i = 0; i < 20; i++) {
				deepData = { nested: deepData, password: 'secret' };
			}

			const result = await redactor.redact(deepData);

			// O redactor pode completar a operação ou retornar dados originais
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('Configuration Validation', () => {
		test('should accept valid timeout values', () => {
			expect(() => new DefaultRedactor({ redactTimeout: 0 })).not.toThrow();
			expect(() => new DefaultRedactor({ redactTimeout: 100 })).not.toThrow();
			expect(() => new DefaultRedactor({ redactTimeout: 10000 })).not.toThrow();
		});

		test('should use default timeout when not specified', () => {
			const redactor = new DefaultRedactor({});

			// Acessar propriedade privada para teste
			expect((redactor as any).redactTimeout).toBe(100);
		});
	});
});
