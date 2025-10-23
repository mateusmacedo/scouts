import { Injectable, Inject } from '@nestjs/common';
import type { Logger } from '@scouts/logger-node';
import { LOGGER_TOKEN } from './constants';

/**
 * Advanced Logger Service that provides enhanced logging capabilities
 * Encapsulates @scouts/logger-node with NestJS-specific utilities
 */
@Injectable()
export class AdvancedLoggerService {
  constructor(@Inject(LOGGER_TOKEN) private readonly logger: Logger) {}

  /**
   * Create a child logger with correlation ID context
   */
  withCorrelation(correlationId: string): AdvancedLoggerService {
    const childLogger = this.logger.withCorrelationId(correlationId);
    return new AdvancedLoggerService(childLogger);
  }

  /**
   * Create a child logger with tenant context
   */
  withTenant(tenantId: string): AdvancedLoggerService {
    const childLogger = this.logger.withFields({ tenantId });
    return new AdvancedLoggerService(childLogger);
  }

  /**
   * Create a child logger with user context
   */
  withUser(userId: string): AdvancedLoggerService {
    const childLogger = this.logger.withFields({ userId });
    return new AdvancedLoggerService(childLogger);
  }

  /**
   * Create a child logger with custom context
   */
  createChildLogger(context: Record<string, unknown>): AdvancedLoggerService {
    const childLogger = this.logger.withFields(context);
    return new AdvancedLoggerService(childLogger);
  }

  /**
   * Log HTTP request details
   */
  logRequest(req: any): void {
    this.logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers?.['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      correlationId: req.correlationId,
    });
  }

  /**
   * Log HTTP response details
   */
  logResponse(res: any, duration: number): void {
    this.logger.info('HTTP Response', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId: res.correlationId,
    });
  }

  /**
   * Log error with context
   */
  logError(error: Error, context?: string): void {
    this.logger.error('Error occurred', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  /**
   * Log business event
   */
  logBusinessEvent(event: string, data: Record<string, unknown>): void {
    this.logger.info(`Business Event: ${event}`, {
      event,
      ...data,
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, unknown>): void {
    this.logger.info(`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  /**
   * Log integration call
   */
  logIntegration(service: string, operation: string, status: 'success' | 'error', duration?: number, error?: Error): void {
    const logData: Record<string, unknown> = {
      service,
      operation,
      status,
    };

    if (duration !== undefined) {
      logData['duration'] = `${duration}ms`;
    }

    if (error) {
      logData['error'] = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (status === 'success') {
      this.logger.info(`Integration: ${service}.${operation}`, logData);
    } else {
      this.logger.error(`Integration: ${service}.${operation}`, logData);
    }
  }

  /**
   * Get the underlying logger instance for advanced usage
   */
  getLogger(): Logger {
    return this.logger;
  }

  // Delegate all standard logger methods
  async info(message: string, fields?: Record<string, unknown>): Promise<void> {
    return this.logger.info(message, fields);
  }

  async debug(message: string, fields?: Record<string, unknown>): Promise<void> {
    return this.logger.debug(message, fields);
  }

  async warn(message: string, fields?: Record<string, unknown>): Promise<void> {
    return this.logger.warn(message, fields);
  }

  async error(message: string, fields?: Record<string, unknown>): Promise<void> {
    return this.logger.error(message, fields);
  }

  async fatal(message: string, fields?: Record<string, unknown>): Promise<void> {
    return this.logger.fatal(message, fields);
  }
}
