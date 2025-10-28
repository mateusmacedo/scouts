import { Mutex } from 'async-mutex';
import type { LogEntry } from '../../logger/logger';

/**
 * Buffer circular para logs com flush automático
 * Thread-safe com async-mutex para operações concorrentes
 * Baseado no draft logger com melhorias para integração
 */
export class LogBuffer {
	private buffer: LogEntry[] = [];
	private head: number = 0;
	private tail: number = 0;
	private count: number = 0;
	private readonly capacity: number;
	private readonly flushInterval: number;
	private flushTimer: NodeJS.Timeout | null = null;
	private isFlushing: boolean = false;
	private readonly mutex = new Mutex();

	constructor(
		capacity: number = 1000,
		flushInterval: number = 5000,
		private readonly onFlush: (entries: LogEntry[]) => Promise<void>
	) {
		this.capacity = capacity;
		this.flushInterval = flushInterval;
		this.buffer = new Array(capacity);
		this.startFlushTimer();
	}

	/**
	 * Adiciona uma entrada ao buffer
	 * Retorna true se adicionado com sucesso, false se buffer cheio
	 */
	add(entry: LogEntry): Promise<boolean> {
		return this.mutex.runExclusive(() => {
			if (this.count >= this.capacity) {
				return false; // Buffer cheio
			}

			this.buffer[this.tail] = entry;
			this.tail = (this.tail + 1) % this.capacity;
			this.count++;

			// Flush automático se buffer cheio
			if (this.count >= this.capacity) {
				// Não aguardar flush interno para evitar deadlock
				// Usar setImmediate para não bloquear o add
				setImmediate(() => {
					this.flushInternal().catch((error) => {
						console.error('LogBuffer: Erro no flush automático:', error);
					});
				});
			}

			return true;
		});
	}

	/**
	 * Força flush do buffer
	 */
	flush(): Promise<void> {
		return this.mutex.runExclusive(async () => {
			await this.flushInternal();
		});
	}

	/**
	 * Obtém estatísticas do buffer
	 */
	getStats(): {
		count: number;
		capacity: number;
		utilization: number;
		isFlushing: boolean;
	} {
		return {
			count: this.count,
			capacity: this.capacity,
			utilization: this.count / this.capacity,
			isFlushing: this.isFlushing,
		};
	}

	/**
	 * Limpa o buffer e para o timer
	 */
	async close(): Promise<void> {
		// Parar timer primeiro
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}

		// Aguardar flush em andamento terminar
		while (this.isFlushing) {
			await new Promise((resolve) => setTimeout(resolve, 1));
		}

		// Flush final antes de fechar
		await this.flush();
	}

	/**
	 * Flush interno (implementação simples)
	 */
	private async flushInternal(): Promise<void> {
		if (this.count === 0 || this.isFlushing) {
			return;
		}

		this.isFlushing = true;

		try {
			const entries: LogEntry[] = [];

			// Coletar todas as entradas do buffer
			for (let i = 0; i < this.count; i++) {
				const index = (this.head + i) % this.capacity;
				entries.push(this.buffer[index]);
			}

			// Limpar buffer
			this.head = 0;
			this.tail = 0;
			this.count = 0;

			// Chamar callback de flush
			if (entries.length > 0) {
				await this.onFlush(entries);
			}
		} catch (error) {
			console.error('LogBuffer: Erro no flush interno:', error);
		} finally {
			this.isFlushing = false;
		}
	}

	/**
	 * Inicia timer de flush automático
	 */
	private startFlushTimer(): void {
		this.flushTimer = setInterval(async () => {
			if (this.count > 0) {
				await this.flush();
			}
		}, this.flushInterval);
	}
}
