import { Test, TestingModule } from '@nestjs/testing';
import { AdvancedLoggerService } from './advanced-logger.service';
import { LOGGER_TOKEN } from './constants';

describe('AdvancedLoggerService', () => {
  let service: AdvancedLoggerService;
  let mockLogger: any;

  beforeEach(async () => {
    mockLogger = {
      withCorrelationId: jest.fn(),
      withFields: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancedLoggerService,
        {
          provide: LOGGER_TOKEN,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AdvancedLoggerService>(AdvancedLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('withCorrelation', () => {
    it('should create child logger with correlation ID', () => {
      const correlationId = 'test-correlation-id';
      const childLogger = { withCorrelationId: jest.fn() };
      mockLogger.withCorrelationId.mockReturnValue(childLogger);

      const result = service.withCorrelation(correlationId);

      expect(mockLogger.withCorrelationId).toHaveBeenCalledWith(correlationId);
      expect(result).toBeInstanceOf(AdvancedLoggerService);
    });
  });

  describe('withTenant', () => {
    it('should create child logger with tenant ID', () => {
      const tenantId = 'test-tenant-id';
      const childLogger = { withFields: jest.fn() };
      mockLogger.withFields.mockReturnValue(childLogger);

      const result = service.withTenant(tenantId);

      expect(mockLogger.withFields).toHaveBeenCalledWith({ tenantId });
      expect(result).toBeInstanceOf(AdvancedLoggerService);
    });
  });

  describe('withUser', () => {
    it('should create child logger with user ID', () => {
      const userId = 'test-user-id';
      const childLogger = { withFields: jest.fn() };
      mockLogger.withFields.mockReturnValue(childLogger);

      const result = service.withUser(userId);

      expect(mockLogger.withFields).toHaveBeenCalledWith({ userId });
      expect(result).toBeInstanceOf(AdvancedLoggerService);
    });
  });

  describe('createChildLogger', () => {
    it('should create child logger with custom context', () => {
      const context = { customField: 'test-value' };
      const childLogger = { withFields: jest.fn() };
      mockLogger.withFields.mockReturnValue(childLogger);

      const result = service.createChildLogger(context);

      expect(mockLogger.withFields).toHaveBeenCalledWith(context);
      expect(result).toBeInstanceOf(AdvancedLoggerService);
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request details', () => {
      const req = {
        method: 'GET',
        url: '/api/users',
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1',
        correlationId: 'test-correlation',
      };

      service.logRequest(req);

      expect(mockLogger.info).toHaveBeenCalledWith('HTTP Request', {
        method: 'GET',
        url: '/api/users',
        userAgent: 'test-agent',
        ip: '127.0.0.1',
        correlationId: 'test-correlation',
      });
    });
  });

  describe('logResponse', () => {
    it('should log HTTP response details', () => {
      const res = {
        statusCode: 200,
        correlationId: 'test-correlation',
      };
      const duration = 150;

      service.logResponse(res, duration);

      expect(mockLogger.info).toHaveBeenCalledWith('HTTP Response', {
        statusCode: 200,
        duration: '150ms',
        correlationId: 'test-correlation',
      });
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = 'test-context';

      service.logError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred', {
        name: 'Error',
        message: 'Test error',
        stack: error.stack,
        context: 'test-context',
      });
    });

    it('should log error without context', () => {
      const error = new Error('Test error');

      service.logError(error);

      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred', {
        name: 'Error',
        message: 'Test error',
        stack: error.stack,
        context: undefined,
      });
    });
  });

  describe('logBusinessEvent', () => {
    it('should log business event', () => {
      const event = 'user_created';
      const data = { userId: '123', email: 'test@example.com' };

      service.logBusinessEvent(event, data);

      expect(mockLogger.info).toHaveBeenCalledWith('Business Event: user_created', {
        event: 'user_created',
        userId: '123',
        email: 'test@example.com',
      });
    });
  });

  describe('logPerformance', () => {
    it('should log performance metric', () => {
      const operation = 'database_query';
      const duration = 250;
      const metadata = { table: 'users', rows: 100 };

      service.logPerformance(operation, duration, metadata);

      expect(mockLogger.info).toHaveBeenCalledWith('Performance: database_query', {
        operation: 'database_query',
        duration: '250ms',
        table: 'users',
        rows: 100,
      });
    });
  });

  describe('logIntegration', () => {
    it('should log successful integration call', () => {
      const serviceName = 'user-service';
      const operation = 'create_user';
      const duration = 300;

      service.logIntegration(serviceName, operation, 'success', duration);

      expect(mockLogger.info).toHaveBeenCalledWith('Integration: user-service.create_user', {
        service: 'user-service',
        operation: 'create_user',
        status: 'success',
        duration: '300ms',
      });
    });

    it('should log failed integration call with error', () => {
      const serviceName = 'user-service';
      const operation = 'create_user';
      const error = new Error('Connection timeout');

      service.logIntegration(serviceName, operation, 'error', undefined, error);

      expect(mockLogger.error).toHaveBeenCalledWith('Integration: user-service.create_user', {
        service: 'user-service',
        operation: 'create_user',
        status: 'error',
        error: {
          name: 'Error',
          message: 'Connection timeout',
          stack: error.stack,
        },
      });
    });
  });

  describe('delegate methods', () => {
    it('should delegate info calls', async () => {
      const message = 'Test message';
      const fields = { test: 'data' };

      await service.info(message, fields);

      expect(mockLogger.info).toHaveBeenCalledWith(message, fields);
    });

    it('should delegate debug calls', async () => {
      const message = 'Debug message';
      const fields = { debug: 'data' };

      await service.debug(message, fields);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, fields);
    });

    it('should delegate warn calls', async () => {
      const message = 'Warning message';
      const fields = { warning: 'data' };

      await service.warn(message, fields);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, fields);
    });

    it('should delegate error calls', async () => {
      const message = 'Error message';
      const fields = { error: 'data' };

      await service.error(message, fields);

      expect(mockLogger.error).toHaveBeenCalledWith(message, fields);
    });

    it('should delegate fatal calls', async () => {
      const message = 'Fatal message';
      const fields = { fatal: 'data' };

      await service.fatal(message, fields);

      expect(mockLogger.fatal).toHaveBeenCalledWith(message, fields);
    });
  });

  describe('getLogger', () => {
    it('should return the underlying logger', () => {
      const logger = service.getLogger();

      expect(logger).toBe(mockLogger);
    });
  });
});
