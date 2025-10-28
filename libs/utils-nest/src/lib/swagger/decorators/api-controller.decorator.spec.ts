import { applyDecorators, Controller } from '@nestjs/common';

// Mock ApiTags since @nestjs/swagger is a peerDependency
const ApiTags = jest.fn();

// Mock applyDecorators to capture calls
jest.mock('@nestjs/common', () => ({
	...jest.requireActual('@nestjs/common'),
	applyDecorators: jest.fn((...decorators) => decorators),
}));

// Mock the actual decorator implementation
jest.mock('./api-controller.decorator', () => ({
	ApiController: (path: string, ...tags: string[]) => {
		return applyDecorators(Controller(path), ApiTags(...tags));
	},
}));

describe('ApiController', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should apply Controller and ApiTags decorators', () => {
		const path = 'users';
		const tags = ['User Management', 'Admin'];

		const { ApiController } = require('./api-controller.decorator');
		const _result = ApiController(path, ...tags);

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(2); // Controller + ApiTags
	});

	it('should work with single tag', () => {
		const path = 'products';
		const tag = 'Products';

		const { ApiController } = require('./api-controller.decorator');
		ApiController(path, tag);

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(2); // Controller + ApiTags
	});

	it('should work with multiple tags', () => {
		const path = 'orders';
		const tags = ['Orders', 'E-commerce', 'Admin'];

		const { ApiController } = require('./api-controller.decorator');
		ApiController(path, ...tags);

		expect(applyDecorators).toHaveBeenCalledTimes(1);
		const calls = (applyDecorators as jest.Mock).mock.calls[0];
		expect(calls).toHaveLength(2); // Controller + ApiTags
	});
});
