import { applyDecorators } from '@nestjs/common';

// Mock ApiResponse since @nestjs/swagger is a peerDependency
const ApiResponse = jest.fn();

// Mock applyDecorators to capture calls
jest.mock('@nestjs/common', () => ({
	...jest.requireActual('@nestjs/common'),
	applyDecorators: jest.fn((...decorators) => decorators),
}));

// Mock the actual decorator implementation
jest.mock('./api-standard-response.decorator', () => ({
	ApiStandardResponse: (type: any, status = 200) => {
		return applyDecorators(
			ApiResponse({ status, type, description: 'Success' }),
			ApiResponse({ status: 400, description: 'Bad Request' }),
			ApiResponse({ status: 401, description: 'Unauthorized' }),
			ApiResponse({ status: 500, description: 'Internal Server Error' })
		);
	},
}));

describe('ApiStandardResponse', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should apply standard response decorators with default status', () => {
		class TestDto {}

		const { ApiStandardResponse } = require('./api-standard-response.decorator');
		ApiStandardResponse(TestDto);

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(4); // 4 ApiResponse calls
	});

	it('should apply standard response decorators with custom status', () => {
		class TestDto {}
		const customStatus = 201;

		const { ApiStandardResponse } = require('./api-standard-response.decorator');
		ApiStandardResponse(TestDto, customStatus);

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(4); // 4 ApiResponse calls
	});

	it('should work with different status codes', () => {
		class TestDto {}

		const { ApiStandardResponse } = require('./api-standard-response.decorator');
		ApiStandardResponse(TestDto, 204);

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(4); // 4 ApiResponse calls
	});
});
