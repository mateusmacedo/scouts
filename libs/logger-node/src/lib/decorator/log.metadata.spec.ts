import {
	copyOwnMetadata,
	getLogMetadata,
	LOG_META_KEY,
	preserveMethodMetadata,
	setLogMetadata,
} from './log.metadata';

// Mock Reflect API
const mockDefineMetadata = jest.fn();
const mockGetOwnMetadata = jest.fn();
const mockGetMetadata = jest.fn();
const mockGetOwnMetadataKeys = jest.fn();

jest.mock('reflect-metadata', () => ({}));

// Mock Reflect
Object.defineProperty(globalThis, 'Reflect', {
	value: {
		defineMetadata: mockDefineMetadata,
		getOwnMetadata: mockGetOwnMetadata,
		getMetadata: mockGetMetadata,
		getOwnMetadataKeys: mockGetOwnMetadataKeys,
	},
	writable: true,
});

describe('Log Metadata', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('copyOwnMetadata', () => {
		it('should copy all metadata from source to target', () => {
			const source = {};
			const target = {};
			const metadataKeys = ['key1', 'key2', 'key3'];
			const metadataValues = ['value1', 'value2', 'value3'];

			mockGetOwnMetadataKeys.mockReturnValue(metadataKeys);
			mockGetOwnMetadata
				.mockReturnValueOnce(metadataValues[0])
				.mockReturnValueOnce(metadataValues[1])
				.mockReturnValueOnce(metadataValues[2]);

			copyOwnMetadata(source, target);

			expect(mockGetOwnMetadataKeys).toHaveBeenCalledWith(source);
			expect(mockGetOwnMetadata).toHaveBeenCalledTimes(3);
			expect(mockDefineMetadata).toHaveBeenCalledTimes(3);

			expect(mockGetOwnMetadata).toHaveBeenNthCalledWith(1, 'key1', source);
			expect(mockGetOwnMetadata).toHaveBeenNthCalledWith(2, 'key2', source);
			expect(mockGetOwnMetadata).toHaveBeenNthCalledWith(3, 'key3', source);

			expect(mockDefineMetadata).toHaveBeenNthCalledWith(1, 'key1', 'value1', target);
			expect(mockDefineMetadata).toHaveBeenNthCalledWith(2, 'key2', 'value2', target);
			expect(mockDefineMetadata).toHaveBeenNthCalledWith(3, 'key3', 'value3', target);
		});

		it('should handle empty metadata', () => {
			const source = {};
			const target = {};

			mockGetOwnMetadataKeys.mockReturnValue([]);

			copyOwnMetadata(source, target);

			expect(mockGetOwnMetadataKeys).toHaveBeenCalledWith(source);
			expect(mockGetOwnMetadata).not.toHaveBeenCalled();
			expect(mockDefineMetadata).not.toHaveBeenCalled();
		});

		it('should handle undefined metadata values', () => {
			const source = {};
			const target = {};
			const metadataKeys = ['key1', 'key2'];

			mockGetOwnMetadataKeys.mockReturnValue(metadataKeys);
			mockGetOwnMetadata.mockReturnValueOnce(undefined).mockReturnValueOnce('value2');

			copyOwnMetadata(source, target);

			expect(mockDefineMetadata).toHaveBeenCalledTimes(2);
			expect(mockDefineMetadata).toHaveBeenNthCalledWith(1, 'key1', undefined, target);
			expect(mockDefineMetadata).toHaveBeenNthCalledWith(2, 'key2', 'value2', target);
		});
	});

	describe('preserveMethodMetadata', () => {
		it('should copy metadata from original to wrapper', () => {
			const targetProto = {};
			const methodName = 'testMethod';
			const original = jest.fn();
			const wrapper = jest.fn();

			mockGetOwnMetadataKeys.mockReturnValue(['key1', 'key2']);
			mockGetOwnMetadata.mockReturnValueOnce('value1').mockReturnValueOnce('value2');

			const result = preserveMethodMetadata(targetProto, methodName, original, wrapper);

			expect(result).toBe(wrapper);
			expect(mockGetOwnMetadataKeys).toHaveBeenCalledWith(original);
			expect(mockDefineMetadata).toHaveBeenCalledTimes(2);
		});

		it('should preserve design metadata', () => {
			const targetProto = {};
			const methodName = 'testMethod';
			const original = jest.fn();
			const wrapper = jest.fn();

			const paramTypes = [String, Number];
			const returnType = String;
			const type = Function;

			mockGetOwnMetadataKeys.mockReturnValue([]);
			mockGetOwnMetadata
				.mockReturnValueOnce(paramTypes)
				.mockReturnValueOnce(returnType)
				.mockReturnValueOnce(type);

			preserveMethodMetadata(targetProto, methodName, original, wrapper);

			expect(mockGetOwnMetadata).toHaveBeenCalledWith('design:paramtypes', targetProto, methodName);
			expect(mockGetOwnMetadata).toHaveBeenCalledWith('design:returntype', targetProto, methodName);
			expect(mockGetOwnMetadata).toHaveBeenCalledWith('design:type', targetProto, methodName);

			expect(mockDefineMetadata).toHaveBeenCalledWith(
				'design:paramtypes',
				paramTypes,
				targetProto,
				methodName
			);
			expect(mockDefineMetadata).toHaveBeenCalledWith(
				'design:returntype',
				returnType,
				targetProto,
				methodName
			);
			expect(mockDefineMetadata).toHaveBeenCalledWith('design:type', type, targetProto, methodName);
		});

		it('should handle missing design metadata', () => {
			const targetProto = {};
			const methodName = 'testMethod';
			const original = jest.fn();
			const wrapper = jest.fn();

			mockGetOwnMetadataKeys.mockReturnValue([]);
			mockGetOwnMetadata.mockReturnValue(undefined);

			preserveMethodMetadata(targetProto, methodName, original, wrapper);

			expect(mockDefineMetadata).not.toHaveBeenCalled();
		});

		it('should handle partial design metadata', () => {
			const targetProto = {};
			const methodName = 'testMethod';
			const original = jest.fn();
			const wrapper = jest.fn();

			const paramTypes = [String, Number];

			mockGetOwnMetadataKeys.mockReturnValue([]);
			mockGetOwnMetadata
				.mockReturnValueOnce(paramTypes)
				.mockReturnValueOnce(undefined)
				.mockReturnValueOnce(undefined);

			preserveMethodMetadata(targetProto, methodName, original, wrapper);

			expect(mockDefineMetadata).toHaveBeenCalledTimes(1);
			expect(mockDefineMetadata).toHaveBeenCalledWith(
				'design:paramtypes',
				paramTypes,
				targetProto,
				methodName
			);
		});
	});

	describe('getLogMetadata', () => {
		it('should get metadata with propertyKey', () => {
			const target = {};
			const propertyKey = 'testMethod';
			const metadata = { level: 'info' };

			mockGetMetadata.mockReturnValue(metadata);

			const result = getLogMetadata(target, propertyKey);

			expect(result).toBe(metadata);
			expect(mockGetMetadata).toHaveBeenCalledWith(LOG_META_KEY, target, propertyKey);
		});

		it('should get metadata without propertyKey', () => {
			const target = {};
			const metadata = { level: 'debug' };

			mockGetMetadata.mockReturnValue(metadata);

			const result = getLogMetadata(target);

			expect(result).toBe(metadata);
			expect(mockGetMetadata).toHaveBeenCalledWith(LOG_META_KEY, target);
		});

		it('should return undefined when no metadata exists', () => {
			const target = {};
			const propertyKey = 'testMethod';

			mockGetMetadata.mockReturnValue(undefined);

			const result = getLogMetadata(target, propertyKey);

			expect(result).toBeUndefined();
		});

		it('should handle symbol propertyKey', () => {
			const target = {};
			const propertyKey = Symbol('testMethod');
			const metadata = { level: 'warn' };

			mockGetMetadata.mockReturnValue(metadata);

			const result = getLogMetadata(target, propertyKey);

			expect(result).toBe(metadata);
			expect(mockGetMetadata).toHaveBeenCalledWith(LOG_META_KEY, target, propertyKey);
		});
	});

	describe('setLogMetadata', () => {
		it('should set metadata with propertyKey', () => {
			const target = {};
			const propertyKey = 'testMethod';
			const metadata = { level: 'error' as const, includeArgs: true };

			setLogMetadata(target, propertyKey, metadata);

			expect(mockDefineMetadata).toHaveBeenCalledWith(LOG_META_KEY, metadata, target, propertyKey);
		});

		it('should set metadata with symbol propertyKey', () => {
			const target = {};
			const propertyKey = Symbol('testMethod');
			const metadata = { level: 'debug' as const, sampleRate: 0.5 };

			setLogMetadata(target, propertyKey, metadata);

			expect(mockDefineMetadata).toHaveBeenCalledWith(LOG_META_KEY, metadata, target, propertyKey);
		});

		it('should handle empty metadata object', () => {
			const target = {};
			const propertyKey = 'testMethod';
			const metadata = {};

			setLogMetadata(target, propertyKey, metadata);

			expect(mockDefineMetadata).toHaveBeenCalledWith(LOG_META_KEY, metadata, target, propertyKey);
		});

		it('should handle null metadata', () => {
			const target = {};
			const propertyKey = 'testMethod';
			const metadata = null as any;

			setLogMetadata(target, propertyKey, metadata);

			expect(mockDefineMetadata).toHaveBeenCalledWith(LOG_META_KEY, metadata, target, propertyKey);
		});
	});

	describe('LOG_META_KEY', () => {
		it('should be a unique symbol', () => {
			expect(typeof LOG_META_KEY).toBe('symbol');
			expect(LOG_META_KEY.toString()).toBe('Symbol(logger-node:log)');
		});

		it('should be consistent across imports', () => {
			const { LOG_META_KEY: importedKey } = require('./log.metadata');
			expect(importedKey).toBe(LOG_META_KEY);
		});
	});

	describe('Edge cases', () => {
		it('should handle null target in copyOwnMetadata', () => {
			expect(() => copyOwnMetadata(null as any, {})).not.toThrow();
		});

		it('should handle undefined target in copyOwnMetadata', () => {
			expect(() => copyOwnMetadata(undefined as any, {})).not.toThrow();
		});

		it('should handle null target in preserveMethodMetadata', () => {
			const result = preserveMethodMetadata(null as any, 'method', jest.fn(), jest.fn());
			expect(result).toBeDefined();
		});

		it('should handle undefined methodName in preserveMethodMetadata', () => {
			const result = preserveMethodMetadata({}, undefined as any, jest.fn(), jest.fn());
			expect(result).toBeDefined();
		});

		it('should handle null original in preserveMethodMetadata', () => {
			const result = preserveMethodMetadata({}, 'method', null as any, jest.fn());
			expect(result).toBeDefined();
		});

		it('should handle null wrapper in preserveMethodMetadata', () => {
			const result = preserveMethodMetadata({}, 'method', jest.fn(), null as any);
			expect(result).toBeNull();
		});
	});

	describe('Integration scenarios', () => {
		it('should work with real class methods', () => {
			class TestClass {
				testMethod() {}
			}

			const metadata = { level: 'info' as const, includeArgs: true };

			// Mock getMetadata to return our test metadata
			mockGetMetadata.mockReturnValue(metadata);

			setLogMetadata(TestClass.prototype, 'testMethod', metadata);

			const retrieved = getLogMetadata(TestClass.prototype, 'testMethod');
			expect(retrieved).toEqual(metadata);
		});

		it('should preserve metadata through method wrapping', () => {
			class TestClass {
				originalMethod() {
					return 'original';
				}
			}

			const original = TestClass.prototype.originalMethod;
			const wrapper = () => 'wrapped';

			// Set up some metadata on the original
			mockGetOwnMetadataKeys.mockReturnValue(['custom:metadata']);
			mockGetOwnMetadata.mockReturnValue('custom-value');

			const result = preserveMethodMetadata(
				TestClass.prototype,
				'originalMethod',
				original,
				wrapper
			);

			expect(result).toBe(wrapper);
			expect(mockDefineMetadata).toHaveBeenCalledWith('custom:metadata', 'custom-value', wrapper);
		});

		it('should handle complex metadata scenarios', () => {
			const source = {};
			const target = {};
			const complexKeys = ['key1', Symbol('key2'), 'key3'];
			const complexValues = [{ nested: 'object' }, 'string', null];

			mockGetOwnMetadataKeys.mockReturnValue(complexKeys);
			mockGetOwnMetadata
				.mockReturnValueOnce(complexValues[0])
				.mockReturnValueOnce(complexValues[1])
				.mockReturnValueOnce(complexValues[2]);

			copyOwnMetadata(source, target);

			expect(mockDefineMetadata).toHaveBeenCalledTimes(3);
			expect(mockDefineMetadata).toHaveBeenNthCalledWith(1, 'key1', complexValues[0], target);
			expect(mockDefineMetadata).toHaveBeenNthCalledWith(
				2,
				complexKeys[1],
				complexValues[1],
				target
			);
			expect(mockDefineMetadata).toHaveBeenNthCalledWith(3, 'key3', complexValues[2], target);
		});
	});
});
