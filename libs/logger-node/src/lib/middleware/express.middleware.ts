// Mock Express types for testing
interface Request {
	method: string;
	url: string;
	headers: Record<string, string>;
	get: (name: string) => string | undefined;
	ip: string;
}

interface Response {
	statusCode: number;
	send: (body: any) => Response;
	status: (code: number) => { send: (body: any) => Response };
}

type NextFunction = (error?: any) => void;
import type { Logger } from '../logger/logger';

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
		(req as any).correlationId = correlationId;
		(req as any).requestId = requestId;

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
		res.send = function (body: any) {
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
			next = function (error?: any) {
				if (error) {
					logger.error('HTTP Error', {
						method: req.method,
						url: req.url,
						error: error.message,
						stack: error.stack,
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

	return (req: Request, res: Response, next: NextFunction): void => {
		const correlationId = req.get(correlationIdHeader) || (req as any).correlationId;

		if (correlationId) {
			// Criar child logger com correlation ID
			const childLogger = (logger as any).child ? (logger as any).child({ correlationId }) : logger;
			(req as any).logger = childLogger;
		} else {
			(req as any).logger = logger;
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
