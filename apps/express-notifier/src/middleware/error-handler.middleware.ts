import type { Logger } from '@scouts/logger-node';
import { NextFunction, Response } from 'express';
import type { CustomRequest, LogFields } from '../types/express';

/**
 * Middleware para tratamento global de erros
 * Demonstra logging estruturado de exceções com logger-node
 */
export function errorHandlerMiddleware(logger: Logger) {
	return (error: Error, req: CustomRequest, res: Response, _next: NextFunction) => {
		const correlationId = req.correlationId;
		const requestLogger = correlationId
			? {
					info: (message: string, fields?: LogFields) =>
						logger.info(message, { ...fields, correlationId }),
					debug: (message: string, fields?: LogFields) =>
						logger.debug(message, { ...fields, correlationId }),
					warn: (message: string, fields?: LogFields) =>
						logger.warn(message, { ...fields, correlationId }),
					error: (message: string, fields?: LogFields) =>
						logger.error(message, { ...fields, correlationId }),
				}
			: logger;

		// Log estruturado do erro
		requestLogger.error('Unhandled error occurred', {
			name: error.name,
			message: error.message,
			stack: error.stack,
			method: req.method,
			url: req.url,
			userAgent: req.headers['user-agent'],
			ip: req.ip || req.connection?.remoteAddress,
			correlationId,
		});

		// Determinar status code baseado no tipo de erro
		let statusCode = 500;
		let errorMessage = 'Internal Server Error';

		if (error.name === 'ValidationError') {
			statusCode = 400;
			errorMessage = 'Validation Error';
		} else if (error.name === 'UnauthorizedError') {
			statusCode = 401;
			errorMessage = 'Unauthorized';
		} else if (error.name === 'ForbiddenError') {
			statusCode = 403;
			errorMessage = 'Forbidden';
		} else if (error.name === 'NotFoundError') {
			statusCode = 404;
			errorMessage = 'Not Found';
		} else if (error.name === 'ConflictError') {
			statusCode = 409;
			errorMessage = 'Conflict';
		}

		// Resposta de erro estruturada
		const errorResponse = {
			error: errorMessage,
			message: process.env['NODE_ENV'] === 'development' ? error.message : 'An error occurred',
			correlationId,
			timestamp: new Date().toISOString(),
		};

		// Log do erro tratado
		requestLogger.warn('Error handled', {
			statusCode,
			errorName: error.name,
			correlationId,
		});

		res.status(statusCode).json(errorResponse);
	};
}
