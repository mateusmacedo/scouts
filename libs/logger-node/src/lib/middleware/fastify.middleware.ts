// Mock Fastify types for testing
interface FastifyRequest {
	method: string;
	url: string;
	headers: Record<string, string>;
	ip: string;
}

interface FastifyReply {
	statusCode: number;
	status: (code: number) => { send: (body: any) => FastifyReply };
}

interface FastifyInstance {
	addHook: (event: string, handler: Function) => void;
}

import type { Logger } from '../logger/logger';

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

	return async (fastify: FastifyInstance) => {
		// Hook para adicionar correlation ID
		fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
			const startTime = Date.now();
			(request as any).startTime = startTime;

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
			(request as any).correlationId = correlationId;
			(request as any).requestId = requestId;

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
		fastify.addHook(
			'onSend',
			async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
				if (logRequests) {
					const startTime = (request as any).startTime;
					const duration = Date.now() - startTime;
					const correlationId = (request as any).correlationId;
					const requestId = (request as any).requestId;

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
			}
		);

		// Hook para log de erros
		if (logErrors) {
			fastify.addHook(
				'onError',
				async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
					const correlationId = (request as any).correlationId;
					const requestId = (request as any).requestId;

					logger.error('HTTP Error', {
						method: request.method,
						url: request.url,
						error: error.message,
						stack: error.stack,
						correlationId,
						requestId,
						...additionalFields,
					});
				}
			);
		}
	};
}

/**
 * Plugin para adicionar correlation ID ao logger
 */
export function createCorrelationIdPlugin(logger: Logger, options: FastifyLoggerOptions = {}) {
	const { correlationIdHeader = 'x-correlation-id' } = options;

	return async (fastify: FastifyInstance) => {
		fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
			const correlationId =
				(request.headers[correlationIdHeader] as string) || (request as any).correlationId;

			if (correlationId) {
				// Criar child logger com correlation ID
				const childLogger = (logger as any).child
					? (logger as any).child({ correlationId })
					: logger;
				(request as any).logger = childLogger;
			} else {
				(request as any).logger = logger;
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
