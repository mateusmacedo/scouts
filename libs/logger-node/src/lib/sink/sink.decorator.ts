import type { LogEntry } from '../logger/logger';
import type { Sink } from './sink';
import type { BaseEnrichmentOptions } from '../options/options';

/**
 * Decorator explícito para enriquecimento de sinks
 * Substitui o Proxy pattern por decoração explícita
 * Adiciona campos base (service, environment, version) automaticamente
 *
 * @example
 * ```typescript
 * const baseSink = new ConsoleSinkAdapter();
 * const decoratedSink = new SinkDecorator(baseSink, {
 *   service: 'user-service',
 *   environment: 'production',
 *   version: '1.0.0'
 * });
 *
 * // Todos os logs terão service, environment, version automaticamente
 * await decoratedSink.write(logEntry);
 * ```
 */
export class SinkDecorator implements Sink {
	private readonly baseSink: Sink;
	private readonly enrichmentOptions: BaseEnrichmentOptions;

	/**
	 * Cria uma nova instância do SinkDecorator
	 * @param baseSink - Sink base para decorar
	 * @param enrichmentOptions - Opções de enriquecimento
	 * @throws Error se baseSink inválido for fornecido
	 */
	constructor(baseSink: Sink, enrichmentOptions: BaseEnrichmentOptions = {}) {
		// Validação fail-fast
		if (!baseSink) {
			throw new Error('SinkDecorator: baseSink é obrigatório');
		}

		if (typeof baseSink.write !== 'function') {
			throw new Error('SinkDecorator: baseSink deve implementar método write()');
		}

		if (typeof baseSink.flush !== 'function') {
			throw new Error('SinkDecorator: baseSink deve implementar método flush()');
		}

		if (typeof baseSink.close !== 'function') {
			throw new Error('SinkDecorator: baseSink deve implementar método close()');
		}

		this.baseSink = baseSink;
		this.enrichmentOptions = enrichmentOptions;
	}

	/**
	 * Escreve uma entrada de log enriquecida
	 * @param entry - A entrada de log para escrever
	 * @throws Error se escrita falhar
	 */
	write(entry: LogEntry): void | Promise<void> {
		const enrichedEntry = this.enrichLogEntry(entry);
		return this.baseSink.write(enrichedEntry);
	}

	/**
	 * Força o flush de logs pendentes
	 * @returns Promise que resolve quando flush está completo
	 */
	flush(): void | Promise<void> {
		return this.baseSink.flush();
	}

	/**
	 * Fecha o sink e limpa recursos
	 * @returns Promise que resolve quando cleanup está completo
	 */
	close(): void | Promise<void> {
		return this.baseSink.close();
	}

	/**
	 * Enriquece uma entrada de log com campos base
	 * @param entry - A entrada de log original
	 * @returns Entrada de log enriquecida
	 */
	private enrichLogEntry(entry: LogEntry): LogEntry {
		const enrichedEntry = { ...entry };

		// Adicionar campos de enriquecimento se fornecidos
		if (this.enrichmentOptions.service) {
			enrichedEntry.args = enrichedEntry.args || [];
			if (Array.isArray(enrichedEntry.args) && enrichedEntry.args.length > 0) {
				const lastArg = enrichedEntry.args[enrichedEntry.args.length - 1];
				if (typeof lastArg === 'object' && lastArg !== null) {
					(lastArg as Record<string, unknown>)['service'] = this.enrichmentOptions.service;
				}
			}
		}

		if (this.enrichmentOptions.environment) {
			enrichedEntry.args = enrichedEntry.args || [];
			if (Array.isArray(enrichedEntry.args) && enrichedEntry.args.length > 0) {
				const lastArg = enrichedEntry.args[enrichedEntry.args.length - 1];
				if (typeof lastArg === 'object' && lastArg !== null) {
					(lastArg as Record<string, unknown>)['environment'] = this.enrichmentOptions.environment;
				}
			}
		}

		if (this.enrichmentOptions.version) {
			enrichedEntry.args = enrichedEntry.args || [];
			if (Array.isArray(enrichedEntry.args) && enrichedEntry.args.length > 0) {
				const lastArg = enrichedEntry.args[enrichedEntry.args.length - 1];
				if (typeof lastArg === 'object' && lastArg !== null) {
					(lastArg as Record<string, unknown>)['version'] = this.enrichmentOptions.version;
				}
			}
		}

		// Adicionar campos adicionais se fornecidos
		if (this.enrichmentOptions.fields) {
			enrichedEntry.args = enrichedEntry.args || [];
			if (Array.isArray(enrichedEntry.args) && enrichedEntry.args.length > 0) {
				const lastArg = enrichedEntry.args[enrichedEntry.args.length - 1];
				if (typeof lastArg === 'object' && lastArg !== null) {
					Object.assign(lastArg as Record<string, unknown>, this.enrichmentOptions.fields);
				}
			}
		}

		return enrichedEntry;
	}
}
