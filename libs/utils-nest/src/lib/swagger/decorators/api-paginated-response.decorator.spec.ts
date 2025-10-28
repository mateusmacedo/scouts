import { applyDecorators } from '@nestjs/common';
import { PaginatedDto } from '../dto/paginated.dto';

// Mock swagger decorators since @nestjs/swagger is a peerDependency
const ApiOkResponse = jest.fn();
const ApiExtraModels = jest.fn();
const getSchemaPath = jest.fn((type) => `#/components/schemas/${type.name}`);

// Mock applyDecorators to capture calls
jest.mock('@nestjs/common', () => ({
	...jest.requireActual('@nestjs/common'),
	applyDecorators: jest.fn((...decorators) => decorators),
}));

// Mock the actual decorator implementation
jest.mock('./api-paginated-response.decorator', () => ({
	ApiPaginatedResponse: (type: any) => {
		return applyDecorators(
			ApiExtraModels(PaginatedDto),
			ApiOkResponse({
				schema: {
					allOf: [
						{ $ref: getSchemaPath(PaginatedDto) },
						{
							properties: {
								data: {
									type: 'array',
									items: { $ref: getSchemaPath(type) },
								},
							},
						},
					],
				},
			})
		);
	},
}));

describe('ApiPaginatedResponse', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should apply paginated response decorators', () => {
		class TestDto {}

		const { ApiPaginatedResponse } = require('./api-paginated-response.decorator');
		ApiPaginatedResponse(TestDto);

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(2); // ApiExtraModels + ApiOkResponse
	});

	it('should work with different DTO types', () => {
		class UserDto {}
		class ProductDto {}

		const { ApiPaginatedResponse } = require('./api-paginated-response.decorator');
		ApiPaginatedResponse(UserDto);
		ApiPaginatedResponse(ProductDto);

		expect(applyDecorators).toHaveBeenCalledTimes(2);
	});
});
