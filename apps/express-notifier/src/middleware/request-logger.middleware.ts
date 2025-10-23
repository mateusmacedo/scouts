import { Request, Response, NextFunction } from 'express';
import type { Logger } from '@scouts/logger-node';

/**
 * Middleware para logging de requisições
 * Demonstra uso direto do logger-node para capturar métricas
 */
export function requestLoggerMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Capturar dados da requisição
    const requestData = {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      correlationId: (req as any).correlationId
    };
    
    // Log da requisição
    logger.info('HTTP Request', requestData);
    
    // Interceptar o final da resposta
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      
      // Log da resposta
      logger.info('HTTP Response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        correlationId: (req as any).correlationId
      });
      
      // Log de performance se demorou muito
      if (duration > 1000) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          correlationId: (req as any).correlationId
        });
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
}
