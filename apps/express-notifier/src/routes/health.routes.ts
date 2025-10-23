import { Router, Request, Response } from 'express';
import { createLogger } from '../config/logger.config';

const router = Router();
const logger = createLogger();

/**
 * GET /health
 * Health check básico
 */
router.get('/', (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  const requestLogger = correlationId ? {
    info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
    debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
    warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
    error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
  } : logger;
  
  requestLogger.debug('Health check requested');
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'express-notifier',
    correlationId
  });
});

/**
 * GET /health/ready
 * Readiness check - verificar se o serviço está pronto para receber tráfego
 */
router.get('/ready', async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  const requestLogger = correlationId ? {
    info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
    debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
    warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
    error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
  } : logger;
  
  requestLogger.debug('Readiness check requested');
  
  try {
    // Verificar dependências (ex: fila de notificações, serviços externos)
    const checks = await performReadinessChecks();
    const allHealthy = checks.every(check => check.status === 'ok');
    
    requestLogger.info('Readiness check completed', {
      allHealthy,
      checksCount: checks.length,
      failedChecks: checks.filter(c => c.status !== 'ok').length
    });
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks,
      correlationId
    });
    
  } catch (error) {
    requestLogger.error('Readiness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
      correlationId
    });
  }
});

/**
 * GET /health/live
 * Liveness check - verificar se o serviço está vivo
 */
router.get('/live', (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  const requestLogger = correlationId ? {
    info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
    debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
    warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
    error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
  } : logger;
  
  requestLogger.debug('Liveness check requested');
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    correlationId
  });
});

/**
 * GET /health/metrics
 * Expor métricas do logger-node
 */
router.get('/metrics', (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  const requestLogger = correlationId ? {
    info: (message: string, fields?: any) => logger.info(message, { ...fields, correlationId }),
    debug: (message: string, fields?: any) => logger.debug(message, { ...fields, correlationId }),
    warn: (message: string, fields?: any) => logger.warn(message, { ...fields, correlationId }),
    error: (message: string, fields?: any) => logger.error(message, { ...fields, correlationId })
  } : logger;
  
  requestLogger.debug('Metrics requested');
  
  try {
    // Obter métricas do logger (se disponível)
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      correlationId
    };
    
    requestLogger.info('Metrics retrieved', {
      uptime: metrics.uptime,
      memoryUsage: metrics.memory.heapUsed
    });
    
    res.json(metrics);
    
  } catch (error) {
    requestLogger.error('Failed to get metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get metrics',
      correlationId
    });
  }
});

/**
 * Realizar verificações de readiness
 */
async function performReadinessChecks(): Promise<Array<{ name: string; status: string; message?: string }>> {
  const checks = [];
  
  // Check 1: Verificar se o logger está funcionando
  try {
    logger.debug('Logger health check');
    checks.push({
      name: 'logger',
      status: 'ok',
      message: 'Logger is working'
    });
  } catch (error) {
    checks.push({
      name: 'logger',
      status: 'error',
      message: 'Logger is not working'
    });
  }
  
  // Check 2: Verificar memória disponível
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (memUsagePercent > 90) {
    checks.push({
      name: 'memory',
      status: 'error',
      message: `High memory usage: ${memUsagePercent.toFixed(2)}%`
    });
  } else {
    checks.push({
      name: 'memory',
      status: 'ok',
      message: `Memory usage: ${memUsagePercent.toFixed(2)}%`
    });
  }
  
  // Check 3: Verificar uptime
  const uptime = process.uptime();
  if (uptime < 1) {
    checks.push({
      name: 'uptime',
      status: 'warning',
      message: 'Service just started'
    });
  } else {
    checks.push({
      name: 'uptime',
      status: 'ok',
      message: `Uptime: ${Math.floor(uptime)}s`
    });
  }
  
  // Check 4: Verificar variáveis de ambiente críticas
  const requiredEnvVars = ['NODE_ENV'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    checks.push({
      name: 'environment',
      status: 'warning',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`
    });
  } else {
    checks.push({
      name: 'environment',
      status: 'ok',
      message: 'All required environment variables are set'
    });
  }
  
  return checks;
}

export { router as healthRoutes };
