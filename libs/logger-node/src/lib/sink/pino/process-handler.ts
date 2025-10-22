import type { LogBuffer } from './log-buffer';

/**
 * Gerenciador de handlers de processo para graceful shutdown
 * Singleton que gerencia cleanup de sinks e buffers
 * Baseado no draft logger com melhorias para integração
 */
export class ProcessHandlerManager {
	private static instance: ProcessHandlerManager | null = null;
	private sinks: Set<{ close: () => Promise<void> | void }> = new Set();
	private buffers: Set<LogBuffer> = new Set();
	private isShuttingDown: boolean = false;
	private shutdownTimeout: number = 5000; // 5 segundos

	private constructor() {
		this.setupProcessHandlers();
	}

	/**
	 * Limpa todos os listeners para evitar memory leaks
	 */
	private cleanupListeners(): void {
		process.removeAllListeners('SIGTERM');
		process.removeAllListeners('SIGINT');
		process.removeAllListeners('SIGUSR2');
		process.removeAllListeners('uncaughtException');
		process.removeAllListeners('unhandledRejection');
	}

	/**
	 * Obtém instância singleton
	 */
	static getInstance(): ProcessHandlerManager {
		if (!ProcessHandlerManager.instance) {
			ProcessHandlerManager.instance = new ProcessHandlerManager();
		}
		return ProcessHandlerManager.instance;
	}

	/**
	 * Registra um sink para cleanup
	 */
	registerSink(sink: { close: () => Promise<void> | void }): void {
		if (this.isShuttingDown) {
			return;
		}
		this.sinks.add(sink);
	}

	/**
	 * Remove um sink do registro
	 */
	unregisterSink(sink: { close: () => Promise<void> | void }): void {
		this.sinks.delete(sink);
	}

	/**
	 * Registra um buffer para cleanup
	 */
	registerBuffer(buffer: LogBuffer): void {
		if (this.isShuttingDown) {
			return;
		}
		this.buffers.add(buffer);
	}

	/**
	 * Remove um buffer do registro
	 */
	unregisterBuffer(buffer: LogBuffer): void {
		this.buffers.delete(buffer);
	}

	/**
	 * Força shutdown imediato
	 */
	async forceShutdown(): Promise<void> {
		if (this.isShuttingDown) {
			return;
		}

		this.isShuttingDown = true;
		console.warn('ProcessHandlerManager: Forçando shutdown...');

		await this.cleanup();
	}

	/**
	 * Configura handlers de processo
	 */
	private setupProcessHandlers(): void {
		// SIGTERM - graceful shutdown
		process.on('SIGTERM', () => {
			console.log('ProcessHandlerManager: SIGTERM recebido, iniciando graceful shutdown...');
			this.gracefulShutdown();
		});

		// SIGINT - graceful shutdown (Ctrl+C)
		process.on('SIGINT', () => {
			console.log('ProcessHandlerManager: SIGINT recebido, iniciando graceful shutdown...');
			this.gracefulShutdown();
		});

		// SIGUSR2 - graceful shutdown (nodemon)
		process.on('SIGUSR2', () => {
			console.log('ProcessHandlerManager: SIGUSR2 recebido, iniciando graceful shutdown...');
			this.gracefulShutdown();
		});

		// uncaughtException - emergency shutdown
		process.on('uncaughtException', (error) => {
			console.error(
				'ProcessHandlerManager: uncaughtException, iniciando emergency shutdown...',
				error
			);
			this.emergencyShutdown();
		});

		// unhandledRejection - emergency shutdown
		process.on('unhandledRejection', (reason, promise) => {
			console.error(
				'ProcessHandlerManager: unhandledRejection, iniciando emergency shutdown...',
				reason
			);
			this.emergencyShutdown();
		});
	}

	/**
	 * Graceful shutdown com timeout
	 */
	private async gracefulShutdown(): Promise<void> {
		if (this.isShuttingDown) {
			return;
		}

		this.isShuttingDown = true;

		// Timeout para forçar shutdown
		const timeout = setTimeout(() => {
			console.error('ProcessHandlerManager: Timeout de shutdown, forçando...');
			this.forceShutdown();
		}, this.shutdownTimeout);

		try {
			await this.cleanup();
			clearTimeout(timeout);
			console.log('ProcessHandlerManager: Graceful shutdown concluído');
		} catch (error) {
			console.error('ProcessHandlerManager: Erro durante graceful shutdown:', error);
			clearTimeout(timeout);
			process.exit(1);
		}
	}

	/**
	 * Emergency shutdown (sem timeout)
	 */
	private async emergencyShutdown(): Promise<void> {
		if (this.isShuttingDown) {
			return;
		}

		this.isShuttingDown = true;

		try {
			await this.cleanup();
			console.log('ProcessHandlerManager: Emergency shutdown concluído');
		} catch (error) {
			console.error('ProcessHandlerManager: Erro durante emergency shutdown:', error);
		} finally {
			process.exit(1);
		}
	}

	/**
	 * Executa cleanup de todos os recursos registrados
	 */
	private async cleanup(): Promise<void> {
		const cleanupPromises: Promise<void>[] = [];

		// Flush e close buffers
		for (const buffer of this.buffers) {
			cleanupPromises.push(
				buffer.close().catch((error) => {
					console.error('ProcessHandlerManager: Erro ao fechar buffer:', error);
				})
			);
		}

		// Close sinks
		for (const sink of this.sinks) {
			cleanupPromises.push(
				Promise.resolve(sink.close()).catch((error) => {
					console.error('ProcessHandlerManager: Erro ao fechar sink:', error);
				})
			);
		}

		// Aguardar todos os cleanups
		await Promise.allSettled(cleanupPromises);

		// Limpar registros
		this.sinks.clear();
		this.buffers.clear();

		// Limpar listeners para evitar memory leaks
		this.cleanupListeners();
	}

	/**
	 * Obtém estatísticas do manager
	 */
	getStats(): {
		sinksCount: number;
		buffersCount: number;
		isShuttingDown: boolean;
	} {
		return {
			sinksCount: this.sinks.size,
			buffersCount: this.buffers.size,
			isShuttingDown: this.isShuttingDown,
		};
	}
}
