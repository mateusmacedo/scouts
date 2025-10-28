import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

// Mock the logger-node functions
jest.mock('@scouts/logger-node', () => ({
	runWithCid: jest.fn((fn, _cid) => fn()),
	ensureCid: jest.fn((cid) => cid || 'generated-cid'),
}));

describe('CorrelationIdMiddleware', () => {
	let middleware: CorrelationIdMiddleware;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CorrelationIdMiddleware],
		}).compile();

		middleware = module.get<CorrelationIdMiddleware>(CorrelationIdMiddleware);

		mockRequest = {
			headers: {},
		};

		mockResponse = {
			setHeader: jest.fn(),
		};

		mockNext = jest.fn();
	});

	it('should be defined', () => {
		expect(middleware).toBeDefined();
	});

	describe('use', () => {
		it('should extract correlation ID from x-correlation-id header', async () => {
			mockRequest.headers = {
				'x-correlation-id': 'test-correlation-id',
			};

			await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.setHeader).toHaveBeenCalledWith(
				'x-correlation-id',
				'test-correlation-id'
			);
			expect(mockNext).toHaveBeenCalled();
		});

		it('should extract correlation ID from x-request-id header', async () => {
			mockRequest.headers = {
				'x-request-id': 'test-request-id',
			};

			await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'test-request-id');
			expect(mockNext).toHaveBeenCalled();
		});

		it('should extract correlation ID from x-trace-id header', async () => {
			mockRequest.headers = {
				'x-trace-id': 'test-trace-id',
			};

			await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'test-trace-id');
			expect(mockNext).toHaveBeenCalled();
		});

		it('should extract correlation ID from correlation-id header', async () => {
			mockRequest.headers = {
				'correlation-id': 'test-correlation-id',
			};

			await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.setHeader).toHaveBeenCalledWith(
				'x-correlation-id',
				'test-correlation-id'
			);
			expect(mockNext).toHaveBeenCalled();
		});

		it('should extract correlation ID from request-id header', async () => {
			mockRequest.headers = {
				'request-id': 'test-request-id',
			};

			await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'test-request-id');
			expect(mockNext).toHaveBeenCalled();
		});

		it('should generate new correlation ID when none found in headers', async () => {
			mockRequest.headers = {};

			await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'generated-cid');
			expect(mockNext).toHaveBeenCalled();
		});

		it('should prioritize x-correlation-id over other headers', async () => {
			mockRequest.headers = {
				'x-correlation-id': 'priority-id',
				'x-request-id': 'request-id',
				'x-trace-id': 'trace-id',
			};

			await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'priority-id');
			expect(mockNext).toHaveBeenCalled();
		});
	});
});
