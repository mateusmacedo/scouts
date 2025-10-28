import { applyDecorators } from '@nestjs/common';

// Mock ApiResponse since @nestjs/swagger is a peerDependency
const ApiResponse = jest.fn();

// Mock applyDecorators to capture calls
jest.mock('@nestjs/common', () => ({
	...jest.requireActual('@nestjs/common'),
	applyDecorators: jest.fn((...decorators) => decorators),
}));

// Mock the actual decorator implementation
jest.mock('./api-error-responses.decorator', () => ({
	ApiErrorResponses: () => {
		return applyDecorators(
			ApiResponse({ status: 400, description: 'Bad Request' }),
			ApiResponse({ status: 401, description: 'Unauthorized' }),
			ApiResponse({ status: 403, description: 'Forbidden' }),
			ApiResponse({ status: 404, description: 'Not Found' }),
			ApiResponse({ status: 500, description: 'Internal Server Error' })
		);
	},
}));

describe('ApiErrorResponses', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should apply common error response decorators', () => {
		const { ApiErrorResponses } = require('./api-error-responses.decorator');
		ApiErrorResponses();

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(5); // 5 error responses
	});

	it('should return the result of applyDecorators', () => {
		const mockResult = ['decorator1', 'decorator2'];
		(applyDecorators as jest.Mock).mockReturnValue(mockResult);

		const { ApiErrorResponses } = require('./api-error-responses.decorator');
		const result = ApiErrorResponses();

		expect(result).toBe(mockResult);
	});

	it('should apply exactly 5 error responses', () => {
		const { ApiErrorResponses } = require('./api-error-responses.decorator');
		ApiErrorResponses();

		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(5);
	});
});
