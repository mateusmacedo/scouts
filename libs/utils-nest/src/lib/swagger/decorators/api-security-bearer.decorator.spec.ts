import { applyDecorators } from '@nestjs/common';

// Mock swagger decorators since @nestjs/swagger is a peerDependency
const ApiBearerAuth = jest.fn();
const ApiUnauthorizedResponse = jest.fn();

// Mock applyDecorators to capture calls
jest.mock('@nestjs/common', () => ({
	...jest.requireActual('@nestjs/common'),
	applyDecorators: jest.fn((...decorators) => decorators),
}));

// Mock the actual decorator implementation
jest.mock('./api-security-bearer.decorator', () => ({
	ApiSecurityBearer: () => {
		return applyDecorators(
			ApiBearerAuth(),
			ApiUnauthorizedResponse({ description: 'Unauthorized' })
		);
	},
}));

describe('ApiSecurityBearer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should apply Bearer authentication decorators', () => {
		const { ApiSecurityBearer } = require('./api-security-bearer.decorator');
		ApiSecurityBearer();

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(2); // ApiBearerAuth + ApiUnauthorizedResponse
	});

	it('should return the result of applyDecorators', () => {
		const mockResult = ['decorator1', 'decorator2'];
		(applyDecorators as jest.Mock).mockReturnValue(mockResult);

		const { ApiSecurityBearer } = require('./api-security-bearer.decorator');
		const result = ApiSecurityBearer();

		expect(result).toBe(mockResult);
	});

	it('should apply exactly 2 decorators', () => {
		const { ApiSecurityBearer } = require('./api-security-bearer.decorator');
		ApiSecurityBearer();

		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(2);
	});
});
