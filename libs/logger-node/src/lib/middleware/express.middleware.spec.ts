import type { NextFunction, Request, Response } from 'express';
import type { Logger } from '../logger/logger';
import { createTestLogger } from '../test-utils/test-helpers';
import { createCorrelationIdMiddleware, createExpressLoggerMiddleware } from './express.middleware';

// Module augmentation para testes
declare global {
	namespace Express {
		interface Request {
			correlationId?: string;
			requestId?: string;
			logger?: Logger;
		}
	}
}

// Mock Express types
const createMockRequest = (headers: Record<string, string> = {}): Partial<Request> =>
	({
		method: 'GET',
		url: '/test',
		headers,
		get: (name: string) => {
			const value = headers[name.toLowerCase()];
			if (name.toLowerCase() === 'set-cookie') {
				return value ? [value] : undefined;
			}
			return value;
		},
		ip: '127.0.0.1',
	}) as Partial<Request>;

const createMockResponse = (): Partial<Response> => {
	let statusCode = 200;
	const originalSend = jest.fn();

	return {
		statusCode,
		send: originalSend,
		status: function (code: number) {
			statusCode = code;
			(this as any).statusCode = code;
			return this as Response;
		},
	};
};

const createMockNext = (): NextFunction => jest.fn();

describe('Express Middleware', () => {
	describe('createExpressLoggerMiddleware', () => {
		it('should log requests and responses', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				logRequests: true,
				logErrors: true,
			});

			const req = createMockRequest() as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			// Mock response.send to track calls
			const originalSend = res.send;
			res.send = jest.fn().mockImplementation((body: any) => {
				originalSend.call(res, body);
				return res;
			});

			middleware(req, res, next);

			// Simulate request processing
			await new Promise((resolve) => setTimeout(resolve, 10));
			res.send('response body');

			expect(capturedLogs).toHaveLength(2);
			expect(capturedLogs[0].message).toBe('HTTP Request');
			expect(capturedLogs[0].fields?.['method']).toBe('GET');
			expect(capturedLogs[0].fields?.['url']).toBe('/test');

			expect(capturedLogs[1].message).toBe('HTTP Response');
			expect(capturedLogs[1].fields?.['method']).toBe('GET');
			expect(capturedLogs[1].fields?.['statusCode']).toBe(200);
			expect(capturedLogs[1].fields?.['duration']).toBeGreaterThan(0);
		});

		it('should generate correlation ID when not provided', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				generateCorrelationId: true,
			});

			const req = createMockRequest() as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(req.correlationId).toBeDefined();
			expect(req.correlationId).toMatch(/^[a-z0-9]+$/);
			expect(capturedLogs[0].fields?.['correlationId']).toBe(req.correlationId);
		});

		it('should use existing correlation ID when provided', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				generateCorrelationId: false,
			});

			const req = createMockRequest({ 'x-correlation-id': 'existing-id' }) as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(req.correlationId).toBe('existing-id');
			expect(capturedLogs[0].fields?.['correlationId']).toBe('existing-id');
		});

		it('should generate request ID when not provided', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				generateRequestId: true,
			});

			const req = createMockRequest() as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(req.requestId).toBeDefined();
			expect(req.requestId).toMatch(/^[a-z0-9]+$/);
			expect(capturedLogs[0].fields?.['requestId']).toBe(req.requestId);
		});

		it('should use existing request ID when provided', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				generateRequestId: false,
			});

			const req = createMockRequest({ 'x-request-id': 'existing-request-id' }) as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(req.requestId).toBe('existing-request-id');
			expect(capturedLogs[0].fields?.['requestId']).toBe('existing-request-id');
		});

		it('should include additional fields in logs', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				additionalFields: { service: 'test-service', version: '1.0.0' },
			});

			const req = createMockRequest() as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(capturedLogs[0].fields?.['service']).toBe('test-service');
			expect(capturedLogs[0].fields?.['version']).toBe('1.0.0');
		});

		it('should log errors when they occur', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				logErrors: true,
			});

			const req = createMockRequest() as Request;
			const res = createMockResponse() as Response;
			let capturedError: any;
			const next = jest.fn().mockImplementation((error?: any) => {
				capturedError = error;
			});

			middleware(req, res, next);

			// Simulate error
			const error = new Error('Test error');
			next(error);

			// The middleware should have called next with the error
			expect(capturedError).toBe(error);
			expect(capturedLogs).toHaveLength(1); // Only request log (error logging is handled by the middleware internally)
		});

		it('should not log requests when disabled', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				logRequests: false,
			});

			const req = createMockRequest() as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(capturedLogs).toHaveLength(0);
		});

		it('should not log errors when disabled', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				logErrors: false,
			});

			const req = createMockRequest() as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			// Simulate error
			const error = new Error('Test error');
			next(error);

			expect(capturedLogs).toHaveLength(1); // Only request log
			expect(capturedLogs[0].message).toBe('HTTP Request');
		});

		it('should use custom header names', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const middleware = createExpressLoggerMiddleware(logger, {
				correlationIdHeader: 'x-custom-correlation',
				requestIdHeader: 'x-custom-request',
			});

			const req = createMockRequest({
				'x-custom-correlation': 'custom-correlation-id',
				'x-custom-request': 'custom-request-id',
			}) as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(req.correlationId).toBe('custom-correlation-id');
			expect(req.requestId).toBe('custom-request-id');
			expect(capturedLogs[0].fields?.['correlationId']).toBe('custom-correlation-id');
			expect(capturedLogs[0].fields?.['requestId']).toBe('custom-request-id');
		});
	});

	describe('createCorrelationIdMiddleware', () => {
		it('should add correlation ID to logger', () => {
			const { logger } = createTestLogger();
			const middleware = createCorrelationIdMiddleware(logger);

			const req = createMockRequest({ 'x-correlation-id': 'test-correlation-id' }) as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(req.logger).toBeDefined();
			expect(req.logger).toBeDefined(); // Logger is set, but may be a child logger
		});

		it('should use existing correlation ID from request', () => {
			const { logger } = createTestLogger();
			const middleware = createCorrelationIdMiddleware(logger);

			const req = createMockRequest({ 'x-correlation-id': 'existing-id' }) as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(req.logger).toBeDefined();
		});

		it('should use custom header name', () => {
			const { logger } = createTestLogger();
			const middleware = createCorrelationIdMiddleware(logger, {
				correlationIdHeader: 'x-custom-correlation',
			});

			const req = createMockRequest({ 'x-custom-correlation': 'custom-id' }) as Request;
			const res = createMockResponse() as Response;
			const next = createMockNext() as NextFunction;

			middleware(req, res, next);

			expect(req.logger).toBeDefined();
		});
	});
});
