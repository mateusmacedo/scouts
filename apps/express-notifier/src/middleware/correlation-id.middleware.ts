import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Logger } from '@scouts/logger-node';

/**
 * Middleware para gerenciar correlation ID
 * Demonstra uso direto do logger-node com child loggers
 */
export function correlationIdMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extrair correlation ID do header ou gerar novo
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    
    // Adicionar ao request e response
    (req as any).correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    
    // Criar logger com contexto de correlation ID
    (req as any).logger = {
      info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
      debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
      warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
      error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
    };
    
    // Log da requisição recebida
    (req as any).logger.info('Request received', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress
    });
    
    next();
  };
}
