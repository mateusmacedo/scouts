import type { LogEntry } from '../../logger/logger';
import { LogBuffer } from './log-buffer';

describe('LogBuffer', () => {
	let buffer: LogBuffer;
	let flushCallback: jest.Mock;

	beforeEach(() => {
		flushCallback = jest.fn().mockResolvedValue(undefined);
		buffer = new LogBuffer(5, 100, flushCallback);
	});

	afterEach(async () => {
		await buffer.close();
	});

	describe('Basic Operations', () => {
		test('should add entries to buffer', async () => {
			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			const result = await buffer.add(entry);
			expect(result).toBe(true);
		});

		test('should handle buffer overflow correctly', async () => {
			// Criar buffer com capacidade menor
			const smallBuffer = new LogBuffer(2, 1000, flushCallback);

			// Adicionar até encher o buffer (2 entradas)
			for (let i = 0; i < 2; i++) {
				const entry: LogEntry = {
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test' },
					outcome: 'success',
					durationMs: 100,
					args: [`Message ${i}`],
				};

				const result = await smallBuffer.add(entry);
				expect(result).toBe(true);
			}

			// Aguardar flush automático completar
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Após flush, buffer deve estar vazio e aceitar novas entradas
			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['New message after flush'],
			};

			const result = await smallBuffer.add(entry);
			expect(result).toBe(true);

			await smallBuffer.close();
		});

		test('should flush automatically when buffer is full', async () => {
			// Adicionar até encher o buffer
			for (let i = 0; i < 5; i++) {
				const entry: LogEntry = {
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test' },
					outcome: 'success',
					durationMs: 100,
					args: [`Message ${i}`],
				};

				await buffer.add(entry);
			}

			// Aguardar flush automático
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(flushCallback).toHaveBeenCalledTimes(1);
			expect(flushCallback).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ args: ['Message 0'] }),
					expect.objectContaining({ args: ['Message 1'] }),
					expect.objectContaining({ args: ['Message 2'] }),
					expect.objectContaining({ args: ['Message 3'] }),
					expect.objectContaining({ args: ['Message 4'] }),
				])
			);
		});
	});

	describe('Manual Flush', () => {
		test('should flush manually', async () => {
			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await buffer.add(entry);
			await buffer.flush();

			expect(flushCallback).toHaveBeenCalledTimes(1);
			expect(flushCallback).toHaveBeenCalledWith([entry]);
		});

		test('should not flush empty buffer', async () => {
			await buffer.flush();
			expect(flushCallback).not.toHaveBeenCalled();
		});
	});

	describe('Statistics', () => {
		test('should provide correct statistics', async () => {
			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await buffer.add(entry);
			const stats = buffer.getStats();

			expect(stats.count).toBe(1);
			expect(stats.capacity).toBe(5);
			expect(stats.utilization).toBe(0.2);
			expect(stats.isFlushing).toBe(false);
		});

		test('should show flushing state during flush', async () => {
			// Criar buffer com flush lento para capturar estado
			const slowFlushCallback = jest.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50)); // Flush lento
			});
			const testBuffer = new LogBuffer(5, 1000, slowFlushCallback);

			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await testBuffer.add(entry);

			// Iniciar flush assíncrono
			const flushPromise = testBuffer.flush();

			// Aguardar um pouco para flush começar
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Verificar estado durante flush
			const stats = testBuffer.getStats();
			expect(stats.isFlushing).toBe(true);

			await flushPromise;
			await testBuffer.close();
		});
	});

	describe('Close Operations', () => {
		test('should flush on close', async () => {
			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await buffer.add(entry);
			await buffer.close();

			expect(flushCallback).toHaveBeenCalledTimes(1);
			expect(flushCallback).toHaveBeenCalledWith([entry]);
		});

		test('should handle multiple close calls', async () => {
			await buffer.close();
			await buffer.close(); // Não deve causar erro
		});
	});

	describe('Concurrent Operations', () => {
		test('should handle concurrent adds', async () => {
			const entries: LogEntry[] = [];

			// Criar múltiplas entradas (menos que capacidade)
			for (let i = 0; i < 3; i++) {
				entries.push({
					level: 'info',
					timestamp: '2023-01-01T00:00:00.000Z',
					scope: { className: 'Test', methodName: 'test' },
					outcome: 'success',
					durationMs: 100,
					args: [`Message ${i}`],
				});
			}

			// Adicionar concorrentemente
			const promises = entries.map((entry) => buffer.add(entry));
			const results = await Promise.all(promises);

			expect(results.every((result) => result === true)).toBe(true);
			// Não deve ter flush automático pois não encheu o buffer
			expect(flushCallback).toHaveBeenCalledTimes(0);
		}, 5000);

		test('should handle concurrent flush operations', async () => {
			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await buffer.add(entry);

			// Múltiplos flushes concorrentes
			const promises = [buffer.flush(), buffer.flush(), buffer.flush()];
			await Promise.all(promises);

			// Deve ter chamado apenas uma vez (mutex protection)
			expect(flushCallback).toHaveBeenCalledTimes(1);
		}, 5000);
	});

	describe('Error Handling', () => {
		test('should handle flush callback errors', async () => {
			const errorCallback = jest.fn().mockRejectedValue(new Error('Flush failed'));
			const errorBuffer = new LogBuffer(5, 100, errorCallback);

			const entry: LogEntry = {
				level: 'info',
				timestamp: '2023-01-01T00:00:00.000Z',
				scope: { className: 'Test', methodName: 'test' },
				outcome: 'success',
				durationMs: 100,
				args: ['Test message'],
			};

			await errorBuffer.add(entry);

			// Flush deve não lançar erro (erro é capturado internamente)
			await errorBuffer.flush();

			// Verificar que callback foi chamado
			expect(errorCallback).toHaveBeenCalledTimes(1);

			await errorBuffer.close();
		});
	});
});
