import type { Logger } from '../logger/logger';

// Module augmentation para adicionar propriedades customizadas ao FastifyRequest
declare module 'fastify' {
	interface FastifyRequest {
		startTime?: number;
		correlationId?: string;
		requestId?: string;
		logger?: Logger;
	}
}

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Type guard para verificar se o logger possui método child
 */
interface LoggerWithChild extends Logger {
	child(fields: Record<string, unknown>): Logger;
}

function hasChildMethod(logger: Logger): logger is LoggerWithChild {
	return 'child' in logger && typeof (logger as LoggerWithChild).child === 'function';
}

/**
 * Middleware para Fastify que adiciona correlation ID aos logs
 * Baseado no draft logger com melhorias para integração
 */
export interface FastifyLoggerOptions {
	/**
	 * Nome do header para correlation ID
	 * Padrão: 'x-correlation-id'
	 */
	correlationIdHeader?: string;

	/**
	 * Nome do header para request ID
	 * Padrão: 'x-request-id'
	 */
	requestIdHeader?: string;

	/**
	 * Gerar correlation ID se não fornecido
	 * Padrão: true
	 */
	generateCorrelationId?: boolean;

	/**
	 * Gerar request ID se não fornecido
	 * Padrão: true
	 */
	generateRequestId?: boolean;

	/**
	 * Log de requests (método, URL, status, tempo)
	 * Padrão: true
	 */
	logRequests?: boolean;

	/**
	 * Log de erros automaticamente
	 * Padrão: true
	 */
	logErrors?: boolean;

	/**
	 * Campos adicionais para incluir nos logs
	 */
	additionalFields?: Record<string, unknown>;
}

/**
 * Plugin para Fastify com correlation ID
 */
export function createFastifyLoggerPlugin(logger: Logger, options: FastifyLoggerOptions = {}) {
	const {
		correlationIdHeader = 'x-correlation-id',
		requestIdHeader = 'x-request-id',
		generateCorrelationId = true,
		generateRequestId = true,
		logRequests = true,
		logErrors = true,
		additionalFields = {},
	} = options;

	return (fastify: FastifyInstance) => {
		// Hook para adicionar correlation ID
		fastify.addHook('onRequest', (...args: unknown[]) => {
			const [request] = args as [FastifyRequest, FastifyReply];
			const startTime = Date.now();
			request.startTime = startTime;

			// Obter ou gerar correlation ID
			let correlationId = request.headers[correlationIdHeader] as string;
			if (!correlationId && generateCorrelationId) {
				correlationId = generateId();
				request.headers[correlationIdHeader] = correlationId;
			}

			// Obter ou gerar request ID
			let requestId = request.headers[requestIdHeader] as string;
			if (!requestId && generateRequestId) {
				requestId = generateId();
				request.headers[requestIdHeader] = requestId;
			}

			// Adicionar IDs ao request
			request.correlationId = correlationId;
			request.requestId = requestId;

			// Log do request se habilitado
			if (logRequests) {
				logger.info('HTTP Request', {
					method: request.method,
					url: request.url,
					userAgent: request.headers['user-agent'],
					ip: request.ip,
					correlationId,
					requestId,
					...additionalFields,
				});
			}
		});

		// Hook para log de response
		fastify.addHook('onSend', (...args: unknown[]) => {
			const [request, reply, payload] = args as [FastifyRequest, FastifyReply, unknown];
			if (logRequests) {
				const startTime = request.startTime;
				const duration = startTime ? Date.now() - startTime : 0;
				const correlationId = request.correlationId;
				const requestId = request.requestId;

				const level = reply.statusCode >= 400 ? 'warn' : 'info';
				logger[level]('HTTP Response', {
					method: request.method,
					url: request.url,
					statusCode: reply.statusCode,
					duration,
					correlationId,
					requestId,
					...additionalFields,
				});
			}

			return payload;
		});

		// Hook para log de erros
		if (logErrors) {
			fastify.addHook('onError', (...args: unknown[]) => {
				const [request, _reply, error] = args as [FastifyRequest, FastifyReply, Error];
				const correlationId = request.correlationId;
				const requestId = request.requestId;

				logger.error('HTTP Error', {
					method: request.method,
					url: request.url,
					error: error.message,
					stack: error.stack,
					correlationId,
					requestId,
					...additionalFields,
				});
			});
		}
	};
}

/**
 * Plugin para adicionar correlation ID ao logger
 */
export function createCorrelationIdPlugin(logger: Logger, options: FastifyLoggerOptions = {}) {
	const { correlationIdHeader = 'x-correlation-id' } = options;

	return (fastify: FastifyInstance) => {
		fastify.addHook('onRequest', (...args: unknown[]) => {
			const [request] = args as [FastifyRequest, FastifyReply];
			const correlationId =
				(request.headers[correlationIdHeader] as string) || request.correlationId;

			if (correlationId) {
				// Criar child logger com correlation ID
				const childLogger = hasChildMethod(logger)
					? logger.child({
							correlationId,
						})
					: logger;
				request.logger = childLogger;
			} else {
				request.logger = logger;
			}
		});
	};
}

/**
 * Gera um ID único
 */
function generateId(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
