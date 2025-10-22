import { ProcessHandlerManager } from './process-handler';
import { LogBuffer } from './log-buffer';

describe('ProcessHandlerManager', () => {
	let manager: ProcessHandlerManager;
	let mockSink: { close: jest.Mock };
	let mockBuffer: LogBuffer;

	beforeEach(() => {
		// Reset singleton
		(ProcessHandlerManager as any).instance = null;
		manager = ProcessHandlerManager.getInstance();

		mockSink = {
			close: jest.fn().mockResolvedValue(undefined),
		};

		mockBuffer = new LogBuffer(10, 100, jest.fn().mockResolvedValue(undefined));
	});

	afterEach(async () => {
		// Cleanup
		if (mockBuffer) {
			await mockBuffer.close();
		}
	});

	describe('Singleton Pattern', () => {
		test('should return same instance', () => {
			const instance1 = ProcessHandlerManager.getInstance();
			const instance2 = ProcessHandlerManager.getInstance();

			expect(instance1).toBe(instance2);
		});
	});

	describe('Sink Registration', () => {
		test('should register and unregister sinks', () => {
			manager.registerSink(mockSink);

			let stats = manager.getStats();
			expect(stats.sinksCount).toBe(1);

			manager.unregisterSink(mockSink);

			stats = manager.getStats();
			expect(stats.sinksCount).toBe(0);
		});

		test('should handle multiple sinks', () => {
			const sink1 = { close: jest.fn().mockResolvedValue(undefined) };
			const sink2 = { close: jest.fn().mockResolvedValue(undefined) };

			manager.registerSink(sink1);
			manager.registerSink(sink2);

			const stats = manager.getStats();
			expect(stats.sinksCount).toBe(2);

			manager.unregisterSink(sink1);

			const statsAfter = manager.getStats();
			expect(statsAfter.sinksCount).toBe(1);
		});
	});

	describe('Buffer Registration', () => {
		test('should register and unregister buffers', () => {
			manager.registerBuffer(mockBuffer);

			let stats = manager.getStats();
			expect(stats.buffersCount).toBe(1);

			manager.unregisterBuffer(mockBuffer);

			stats = manager.getStats();
			expect(stats.buffersCount).toBe(0);
		});

		test('should handle multiple buffers', () => {
			const buffer1 = new LogBuffer(10, 100, jest.fn().mockResolvedValue(undefined));
			const buffer2 = new LogBuffer(10, 100, jest.fn().mockResolvedValue(undefined));

			manager.registerBuffer(buffer1);
			manager.registerBuffer(buffer2);

			const stats = manager.getStats();
			expect(stats.buffersCount).toBe(2);

			manager.unregisterBuffer(buffer1);

			const statsAfter = manager.getStats();
			expect(statsAfter.buffersCount).toBe(1);

			// Cleanup
			buffer1.close();
			buffer2.close();
		});
	});

	describe('Force Shutdown', () => {
		test('should cleanup all registered resources', async () => {
			manager.registerSink(mockSink);
			manager.registerBuffer(mockBuffer);

			await manager.forceShutdown();

			expect(mockSink.close).toHaveBeenCalledTimes(1);

			const stats = manager.getStats();
			expect(stats.sinksCount).toBe(0);
			expect(stats.buffersCount).toBe(0);
			expect(stats.isShuttingDown).toBe(true);
		});

		test('should handle shutdown errors gracefully', async () => {
			const errorSink = {
				close: jest.fn().mockRejectedValue(new Error('Close failed')),
			};

			manager.registerSink(errorSink);
			manager.registerSink(mockSink);

			// Não deve lançar erro
			await expect(manager.forceShutdown()).resolves.not.toThrow();

			expect(errorSink.close).toHaveBeenCalledTimes(1);
			expect(mockSink.close).toHaveBeenCalledTimes(1);
		});

		test('should not register new resources after shutdown', () => {
			manager.forceShutdown();

			manager.registerSink(mockSink);
			manager.registerBuffer(mockBuffer);

			const stats = manager.getStats();
			expect(stats.sinksCount).toBe(0);
			expect(stats.buffersCount).toBe(0);
		});
	});

	describe('Statistics', () => {
		test('should provide correct statistics', () => {
			const sink1 = { close: jest.fn().mockResolvedValue(undefined) };
			const sink2 = { close: jest.fn().mockResolvedValue(undefined) };
			const buffer1 = new LogBuffer(10, 100, jest.fn().mockResolvedValue(undefined));
			const buffer2 = new LogBuffer(10, 100, jest.fn().mockResolvedValue(undefined));

			manager.registerSink(sink1);
			manager.registerSink(sink2);
			manager.registerBuffer(buffer1);
			manager.registerBuffer(buffer2);

			const stats = manager.getStats();

			expect(stats.sinksCount).toBe(2);
			expect(stats.buffersCount).toBe(2);
			expect(stats.isShuttingDown).toBe(false);

			// Cleanup
			buffer1.close();
			buffer2.close();
		});
	});

	describe('Process Signal Handling', () => {
		test('should handle SIGTERM gracefully', async () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			manager.registerSink(mockSink);

			// Simular SIGTERM
			process.emit('SIGTERM' as any);

			// Aguardar processamento
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SIGTERM recebido'));

			consoleSpy.mockRestore();
		});

		test('should handle SIGINT gracefully', async () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			manager.registerSink(mockSink);

			// Simular SIGINT
			process.emit('SIGINT' as any);

			// Aguardar processamento
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SIGINT recebido'));

			consoleSpy.mockRestore();
		});

		test('should handle uncaughtException', async () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

			manager.registerSink(mockSink);

			// Simular uncaughtException
			process.emit('uncaughtException' as any, new Error('Test error'));

			// Aguardar processamento
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('uncaughtException'),
				expect.any(Error)
			);

			consoleSpy.mockRestore();
			exitSpy.mockRestore();
		});
	});

	describe('Multiple Instances', () => {
		test('should handle multiple manager instances', () => {
			// Reset singleton
			(ProcessHandlerManager as any).instance = null;

			const manager1 = ProcessHandlerManager.getInstance();
			const manager2 = ProcessHandlerManager.getInstance();

			expect(manager1).toBe(manager2);

			manager1.registerSink(mockSink);

			const stats1 = manager1.getStats();
			const stats2 = manager2.getStats();

			expect(stats1.sinksCount).toBe(1);
			expect(stats2.sinksCount).toBe(1);
		});
	});
});
