import type { Logger } from '../logger/logger';

// Module augmentation para adicionar propriedades customizadas ao Express Request
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace -- Module augmentation padrão do TypeScript para Express
	namespace Express {
		interface Request {
			correlationId?: string;
			requestId?: string;
			logger?: Logger;
		}
	}
}

import type { NextFunction, Request, Response } from 'express';

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
 * Middleware para Express que adiciona correlation ID aos logs
 * Baseado no draft logger com melhorias para integração
 */
export interface ExpressLoggerOptions {
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
 * Middleware para Express com correlation ID
 */
export function createExpressLoggerMiddleware(logger: Logger, options: ExpressLoggerOptions = {}) {
	const {
		correlationIdHeader = 'x-correlation-id',
		requestIdHeader = 'x-request-id',
		generateCorrelationId = true,
		generateRequestId = true,
		logRequests = true,
		logErrors = true,
		additionalFields = {},
	} = options;

	return (req: Request, res: Response, next: NextFunction): void => {
		const startTime = Date.now();

		// Obter ou gerar correlation ID
		let correlationId = req.get(correlationIdHeader);
		if (!correlationId && generateCorrelationId) {
			correlationId = generateId();
			req.headers[correlationIdHeader] = correlationId;
		}

		// Obter ou gerar request ID
		let requestId = req.get(requestIdHeader);
		if (!requestId && generateRequestId) {
			requestId = generateId();
			req.headers[requestIdHeader] = requestId;
		}

		// Adicionar IDs ao request para uso posterior
		req.correlationId = correlationId;
		req.requestId = requestId;

		// Log do request se habilitado
		if (logRequests) {
			logger.info('HTTP Request', {
				method: req.method,
				url: req.url,
				userAgent: req.get('user-agent'),
				ip: req.ip,
				correlationId,
				requestId,
				...additionalFields,
			});
		}

		// Interceptar response para log de status e tempo
		const originalSend = res.send;
		res.send = function (body: unknown) {
			const duration = Date.now() - startTime;

			if (logRequests) {
				const level = res.statusCode >= 400 ? 'warn' : 'info';
				logger[level]('HTTP Response', {
					method: req.method,
					url: req.url,
					statusCode: res.statusCode,
					duration,
					correlationId,
					requestId,
					...additionalFields,
				});
			}

			return originalSend.call(this, body);
		};

		// Interceptar erros para log automático
		if (logErrors) {
			const originalNext = next;
			next = (error?: Error | string) => {
				if (error) {
					logger.error('HTTP Error', {
						method: req.method,
						url: req.url,
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
						correlationId,
						requestId,
						...additionalFields,
					});
				}
				return originalNext(error);
			};
		}

		next();
	};
}

/**
 * Middleware para adicionar correlation ID ao logger
 */
export function createCorrelationIdMiddleware(logger: Logger, options: ExpressLoggerOptions = {}) {
	const { correlationIdHeader = 'x-correlation-id' } = options;

	return (req: Request, _res: Response, next: NextFunction): void => {
		const correlationId = req.get(correlationIdHeader) || req.correlationId;

		if (correlationId) {
			// Criar child logger com correlation ID
			const childLogger = hasChildMethod(logger)
				? logger.child({
						correlationId,
					})
				: logger;
			req.logger = childLogger;
		} else {
			req.logger = logger;
		}

		next();
	};
}

/**
 * Gera um ID único
 */
function generateId(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
