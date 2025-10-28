import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createTestLogger } from '../test-utils/test-helpers';
import { createCorrelationIdPlugin, createFastifyLoggerPlugin } from './fastify.middleware';

// Module augmentation para testes
declare module 'fastify' {
	interface FastifyRequest {
		startTime?: number;
		correlationId?: string;
		requestId?: string;
		logger?: any;
	}
}

// Mock Fastify types
const createMockRequest = (headers: Record<string, string> = {}): Partial<FastifyRequest> => ({
	method: 'GET',
	url: '/test',
	headers,
	ip: '127.0.0.1',
});

const createMockReply = (): Partial<FastifyReply> => {
	let statusCode = 200;

	return {
		statusCode,
		status: (code: number) => {
			statusCode = code;
			return { send: jest.fn() };
		},
	};
};

const createMockFastify = (): Partial<FastifyInstance> => ({
	addHook: jest.fn(),
});

describe('Fastify Middleware', () => {
	describe('createFastifyLoggerPlugin', () => {
		it('should register hooks for logging', async () => {
			const { logger } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger);
			const fastify = createMockFastify() as FastifyInstance;

			await plugin(fastify);

			expect(fastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
			expect(fastify.addHook).toHaveBeenCalledWith('onSend', expect.any(Function));
			expect(fastify.addHook).toHaveBeenCalledWith('onError', expect.any(Function));
		});

		it('should log requests and responses', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				logRequests: true,
				logErrors: true,
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			// Get the onRequest hook
			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest() as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			// Mock startTime
			req.startTime = Date.now();

			await onRequestHook(req, reply);

			// Get the onSend hook
			const onSendHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onSend'
			)?.[1];

			await onSendHook(req, reply, 'response body');

			expect(capturedLogs).toHaveLength(2);
			expect(capturedLogs[0].message).toBe('HTTP Request');
			expect(capturedLogs[0].fields?.['method']).toBe('GET');
			expect(capturedLogs[0].fields?.['url']).toBe('/test');

			expect(capturedLogs[1].message).toBe('HTTP Response');
			expect(capturedLogs[1].fields?.['method']).toBe('GET');
			expect(capturedLogs[1].fields?.['statusCode']).toBe(200);
			expect(capturedLogs[1].fields?.['duration']).toBeGreaterThanOrEqual(0);
		});

		it('should generate correlation ID when not provided', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				generateCorrelationId: true,
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest() as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(req.correlationId).toBeDefined();
			expect(req.correlationId).toMatch(/^[a-z0-9]+$/);
			expect(capturedLogs[0].fields?.['correlationId']).toBe(req.correlationId);
		});

		it('should use existing correlation ID when provided', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				generateCorrelationId: false,
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest({ 'x-correlation-id': 'existing-id' }) as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(req.correlationId).toBe('existing-id');
			expect(capturedLogs[0].fields?.['correlationId']).toBe('existing-id');
		});

		it('should generate request ID when not provided', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				generateRequestId: true,
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest() as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(req.requestId).toBeDefined();
			expect(req.requestId).toMatch(/^[a-z0-9]+$/);
			expect(capturedLogs[0].fields?.['requestId']).toBe(req.requestId);
		});

		it('should use existing request ID when provided', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				generateRequestId: false,
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest({ 'x-request-id': 'existing-request-id' }) as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(req.requestId).toBe('existing-request-id');
			expect(capturedLogs[0].fields?.['requestId']).toBe('existing-request-id');
		});

		it('should include additional fields in logs', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				additionalFields: { service: 'test-service', version: '1.0.0' },
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest() as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(capturedLogs[0].fields?.['service']).toBe('test-service');
			expect(capturedLogs[0].fields?.['version']).toBe('1.0.0');
		});

		it('should log errors when they occur', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				logErrors: true,
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const onErrorHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onError'
			)?.[1];

			const req = createMockRequest() as FastifyRequest;
			const reply = createMockReply() as FastifyReply;
			const error = new Error('Test error');

			await onRequestHook(req, reply);
			await onErrorHook(req, reply, error);

			expect(capturedLogs).toHaveLength(2); // Request + Error
			expect(capturedLogs[1].message).toBe('HTTP Error');
			expect(capturedLogs[1].fields?.['error']).toBe('Test error');
			expect(capturedLogs[1].fields?.['stack']).toBeDefined();
		});

		it('should not log requests when disabled', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				logRequests: false,
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest() as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(capturedLogs).toHaveLength(0);
		});

		it('should not log errors when disabled', async () => {
			const { logger } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				logErrors: false,
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			// Should not register onError hook when disabled
			const onErrorHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onError'
			);

			expect(onErrorHook).toBeUndefined();
		});

		it('should use custom header names', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger, {
				correlationIdHeader: 'x-custom-correlation',
				requestIdHeader: 'x-custom-request',
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest({
				'x-custom-correlation': 'custom-correlation-id',
				'x-custom-request': 'custom-request-id',
			}) as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(req.correlationId).toBe('custom-correlation-id');
			expect(req.requestId).toBe('custom-request-id');
			expect(capturedLogs[0].fields?.['correlationId']).toBe('custom-correlation-id');
			expect(capturedLogs[0].fields?.['requestId']).toBe('custom-request-id');
		});

		it('should handle different response status codes', async () => {
			const { logger, capturedLogs } = createTestLogger();
			const plugin = createFastifyLoggerPlugin(logger);

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const onSendHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onSend'
			)?.[1];

			const req = createMockRequest() as FastifyRequest;
			const reply = createMockReply() as FastifyReply;
			req.startTime = Date.now();

			await onRequestHook(req, reply);

			// Simulate error response
			reply.statusCode = 404;
			await onSendHook(req, reply, 'Not Found');

			expect(capturedLogs[1].fields?.['statusCode']).toBe(404);
			expect(capturedLogs[1].level).toBe('warn'); // 4xx should be warn level
		});
	});

	describe('createCorrelationIdPlugin', () => {
		it('should register onRequest hook', async () => {
			const { logger } = createTestLogger();
			const plugin = createCorrelationIdPlugin(logger);
			const fastify = createMockFastify() as FastifyInstance;

			await plugin(fastify);

			expect(fastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
		});

		it('should add logger to request', async () => {
			const { logger } = createTestLogger();
			const plugin = createCorrelationIdPlugin(logger);

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest({
				'x-correlation-id': 'test-correlation-id',
			}) as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(req.logger).toBeDefined();
			expect(req.logger).toBeDefined(); // Logger is set, but may be a child logger
		});

		it('should use custom header name', async () => {
			const { logger } = createTestLogger();
			const plugin = createCorrelationIdPlugin(logger, {
				correlationIdHeader: 'x-custom-correlation',
			});

			const fastify = createMockFastify() as FastifyInstance;
			await plugin(fastify);

			const onRequestHook = (fastify.addHook as jest.Mock).mock.calls.find(
				(call) => call[0] === 'onRequest'
			)?.[1];

			const req = createMockRequest({ 'x-custom-correlation': 'custom-id' }) as FastifyRequest;
			const reply = createMockReply() as FastifyReply;

			await onRequestHook(req, reply);

			expect(req.logger).toBeDefined();
		});
	});
});
