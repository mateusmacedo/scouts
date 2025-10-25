import type { Logger } from '@scouts/logger-node';
import { NextFunction, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { CustomRequest, LogFields } from '../types/express';

/**
 * Middleware para gerenciar correlation ID
 * Demonstra uso direto do logger-node com child loggers
 */
export function correlationIdMiddleware(logger: Logger) {
	return (req: CustomRequest, res: Response, next: NextFunction) => {
		// Extrair correlation ID do header ou gerar novo
		const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

		// Adicionar ao request e response
		req.correlationId = correlationId;
		res.setHeader('x-correlation-id', correlationId);

		// Criar logger com contexto de correlation ID
		req.logger = {
			info: (message: string, fields?: LogFields) =>
				logger.info(message, { ...fields, correlationId }),
			debug: (message: string, fields?: LogFields) =>
				logger.debug(message, { ...fields, correlationId }),
			warn: (message: string, fields?: LogFields) =>
				logger.warn(message, { ...fields, correlationId }),
			error: (message: string, fields?: LogFields) =>
				logger.error(message, { ...fields, correlationId }),
		};

		// Log da requisição recebida
		req.logger.info('Request received', {
			method: req.method,
			url: req.url,
			userAgent: req.headers['user-agent'],
			ip: req.ip || req.connection?.remoteAddress,
		});

		next();
	};
}
