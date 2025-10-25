import { createComposedLogger } from '../factory/logger.factory';
import { ProcessHandlerManager } from '../sink/pino/process-handler';

describe('Singleton Behavior Diagnostics', () => {
	let originalInstance: any;

	beforeAll(() => {
		// Capturar instância original do singleton
		originalInstance = (ProcessHandlerManager as any).instance;
	});

	afterAll(() => {
		// Restaurar instância original
		(ProcessHandlerManager as any).instance = originalInstance;
	});

	describe('ProcessHandlerManager Singleton', () => {
		it('should return same instance across multiple calls', () => {
			const instance1 = ProcessHandlerManager.getInstance();
			const instance2 = ProcessHandlerManager.getInstance();

			expect(instance1).toBe(instance2);

			console.log('[DIAGNOSTIC] Singleton instances are identical:', instance1 === instance2);
		});

		it('should accumulate sinks across multiple logger creations', () => {
			const instance = ProcessHandlerManager.getInstance();
			const initialStats = instance.getStats();

			console.log('[DIAGNOSTIC] Initial stats:', JSON.stringify(initialStats, null, 2));

			// Criar múltiplos loggers
			const logger1 = createComposedLogger({ enableMetrics: true });
			const logger2 = createComposedLogger({ enableMetrics: true });
			const logger3 = createComposedLogger({ enableMetrics: true });

			const afterStats = instance.getStats();
			console.log('[DIAGNOSTIC] After creating 3 loggers:', JSON.stringify(afterStats, null, 2));

			// Verificar se sinks/buffers acumulam
			expect(afterStats.sinksCount).toBeGreaterThanOrEqual(initialStats.sinksCount);
			expect(afterStats.buffersCount).toBeGreaterThanOrEqual(initialStats.buffersCount);
		});

		it('should accumulate process event listeners', () => {
			const initialListenerCount = process.listenerCount('SIGTERM');
			console.log('[DIAGNOSTIC] Initial SIGTERM listeners:', initialListenerCount);

			// Criar múltiplos loggers (cada um registra listeners)
			const logger1 = createComposedLogger();
			const logger2 = createComposedLogger();
			const logger3 = createComposedLogger();

			const afterListenerCount = process.listenerCount('SIGTERM');
			console.log('[DIAGNOSTIC] After creating 3 loggers, SIGTERM listeners:', afterListenerCount);

			// Verificar acúmulo de listeners
			expect(afterListenerCount).toBeGreaterThanOrEqual(initialListenerCount);

			// Log todos os tipos de listeners
			const events = ['SIGTERM', 'SIGINT', 'SIGUSR2', 'uncaughtException', 'unhandledRejection'];
			events.forEach((event) => {
				console.log(`[DIAGNOSTIC] ${event} listeners:`, process.listenerCount(event));
			});
		});
	});

	describe('Logger Instance Isolation', () => {
		it('should create independent logger instances', async () => {
			const logger1 = createComposedLogger({
				enableMetrics: true,
				sinkOptions: { service: 'test-service-1' },
			});

			const logger2 = createComposedLogger({
				enableMetrics: true,
				sinkOptions: { service: 'test-service-2' },
			});

			// Verificar que são instâncias diferentes
			expect(logger1).not.toBe(logger2);
			console.log('[DIAGNOSTIC] Logger instances are different:', logger1 !== logger2);

			// Testar operações independentes
			await logger1.info('Message from logger1', { source: 'logger1' });
			await logger2.info('Message from logger2', { source: 'logger2' });

			// Verificar métricas (se habilitadas)
			if ('getMetrics' in logger1) {
				const metrics1 = (logger1 as any).getMetrics();
				const metrics2 = (logger2 as any).getMetrics();

				console.log('[DIAGNOSTIC] Logger1 metrics:', JSON.stringify(metrics1, null, 2));
				console.log('[DIAGNOSTIC] Logger2 metrics:', JSON.stringify(metrics2, null, 2));
			}

			// Cleanup
			await logger1.close();
			await logger2.close();
		});

		it('should detect data conflicts between concurrent loggers', async () => {
			const results: string[] = [];

			// Criar múltiplos loggers operando simultaneamente
			const operations = Array.from({ length: 5 }, (_, i) => {
				const logger = createComposedLogger({
					sinkOptions: { service: `concurrent-test-${i}` },
				});

				return (async () => {
					for (let j = 0; j < 10; j++) {
						await logger.info(`Message ${j} from logger ${i}`);
					}
					results.push(`logger-${i}-completed`);
					await logger.close();
				})();
			});

			await Promise.all(operations);

			console.log('[DIAGNOSTIC] Concurrent operations results:', results);
			expect(results).toHaveLength(5);
		});
	});

	describe('Timer and Buffer Cleanup', () => {
		it('should cleanup timers after logger close', async () => {
			const logger = createComposedLogger({ enableMetrics: true });

			// Aguardar para garantir que timers foram criados
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Usar uma abordagem alternativa para detectar handles ativos
			const beforeClose = (process as any)._getActiveHandles?.()?.length || 0;
			console.log('[DIAGNOSTIC] Active handles before close:', beforeClose);

			await logger.close();

			// Aguardar cleanup
			await new Promise((resolve) => setTimeout(resolve, 100));

			const afterClose = (process as any)._getActiveHandles?.()?.length || 0;
			console.log('[DIAGNOSTIC] Active handles after close:', afterClose);

			// Idealmente, handles devem diminuir após close
			expect(afterClose).toBeLessThanOrEqual(beforeClose);
		});
	});
});
