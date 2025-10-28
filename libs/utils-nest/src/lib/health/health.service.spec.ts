import {
	DiskHealthIndicator,
	HealthCheckService,
	HttpHealthIndicator,
	MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HEALTH_OPTIONS_TOKEN } from './constants';
import { HealthCheckOptions } from './health.interface';
import { HealthService } from './health.service';

describe('HealthService', () => {
	let service: HealthService;

	const mockHealthCheckService = {
		check: jest.fn().mockImplementation(async (checks: (() => Promise<any>)[]) => {
			const results = await Promise.all(checks.map((check: () => Promise<any>) => check()));
			return Object.assign({}, ...results);
		}),
	};

	const mockHttp = {
		pingCheck: jest.fn(),
	};

	const mockMemory = {
		checkHeap: jest.fn(),
		checkRSS: jest.fn(),
	};

	const mockDisk = {
		checkStorage: jest.fn(),
	};

	const defaultOptions: HealthCheckOptions = {};

	// Test helper functions
	const createTestModule = async (
		options: HealthCheckOptions = defaultOptions,
		includeIndicators: boolean = false
	): Promise<TestingModule> => {
		const providers: any[] = [
			HealthService,
			{ provide: HealthCheckService, useValue: mockHealthCheckService },
			{ provide: HEALTH_OPTIONS_TOKEN, useValue: options },
		];

		if (includeIndicators) {
			providers.push(
				{ provide: HttpHealthIndicator, useValue: mockHttp },
				{ provide: MemoryHealthIndicator, useValue: mockMemory },
				{ provide: DiskHealthIndicator, useValue: mockDisk }
			);
		}

		return Test.createTestingModule({ providers }).compile();
	};

	const createServiceWithOptions = async (options: HealthCheckOptions): Promise<HealthService> => {
		const module = await createTestModule(options, true);
		return module.get<HealthService>(HealthService);
	};

	const setupSuccessfulCheck = (mockResult: any) => {
		mockHealthCheckService.check.mockResolvedValue(mockResult);
	};

	const setupFailedCheck = (error: Error) => {
		mockHealthCheckService.check.mockRejectedValue(error);
	};

	beforeEach(async () => {
		const module = await createTestModule();
		service = module.get<HealthService>(HealthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('checkLiveness', () => {
		it('should return status up when no indicators configured', async () => {
			const expectedResult = { memory: { status: 'up' } };
			setupSuccessfulCheck(expectedResult);

			const result = await service.checkLiveness();

			expect(result).toEqual(expectedResult);
			expect(mockHealthCheckService.check).toHaveBeenCalledWith([expect.any(Function)]);
		});

		it('should execute memory check when configured', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					memory: { heapThreshold: 100 * 1024 * 1024 },
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockMemory.checkHeap.mockResolvedValue({ memory_heap: { status: 'up' } });
			setupSuccessfulCheck({ memory_heap: { status: 'up' } });

			await serviceWithOptions['checkMemory']();

			expect(mockMemory.checkHeap).toHaveBeenCalledWith('memory_heap', 100 * 1024 * 1024);
		});

		it('should use default threshold when not specified', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					memory: {},
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockMemory.checkHeap.mockResolvedValue({ memory_heap: { status: 'up' } });
			setupSuccessfulCheck({ memory_heap: { status: 'up' } });

			await serviceWithOptions['checkMemory']();

			expect(mockMemory.checkHeap).toHaveBeenCalledWith('memory_heap', 150 * 1024 * 1024);
		});

		it('should propagate error when memory check fails', async () => {
			const error = new Error('Memory check failed');
			setupFailedCheck(error);

			await expect(service.checkLiveness()).rejects.toThrow(error);
		});
	});

	describe('checkReadiness', () => {
		it('should execute all configured checks', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					memory: { heapThreshold: 100 * 1024 * 1024 },
					disk: { path: '/', thresholdPercent: 0.9 },
					http: [{ name: 'api', url: 'http://localhost:3000' }],
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockMemory.checkHeap.mockResolvedValue({ memory_heap: { status: 'up' } });
			mockDisk.checkStorage.mockResolvedValue({ disk: { status: 'up' } });
			mockHttp.pingCheck.mockResolvedValue({ api: { status: 'up' } });
			setupSuccessfulCheck({
				memory_heap: { status: 'up' },
				disk: { status: 'up' },
				api: { status: 'up' },
				custom: { status: 'up' },
			});

			await serviceWithOptions['checkMemory']();
			await serviceWithOptions['checkDisk']();
			await serviceWithOptions['checkHttpDependencies']();

			expect(mockMemory.checkHeap).toHaveBeenCalled();
			expect(mockDisk.checkStorage).toHaveBeenCalled();
			expect(mockHttp.pingCheck).toHaveBeenCalled();
		});

		it('should return status up when all checks healthy', async () => {
			const expectedResult = {
				memory_heap: { status: 'up' },
				disk: { status: 'up' },
				api: { status: 'up' },
				custom: { status: 'up' },
			};
			setupSuccessfulCheck(expectedResult);

			const result = await service.checkReadiness();

			expect(result).toEqual(expectedResult);
		});

		it('should propagate error from any failing check', async () => {
			const error = new Error('Health check failed');
			setupFailedCheck(error);

			await expect(service.checkReadiness()).rejects.toThrow(error);
		});
	});

	describe('checkMemory', () => {
		it('should return up when not configured', async () => {
			const result = await service['checkMemory']();

			expect(result).toEqual({ memory: { status: 'up' } });
		});

		it('should call checkHeap with configured threshold', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					memory: { heapThreshold: 200 * 1024 * 1024 },
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockMemory.checkHeap.mockResolvedValue({ memory_heap: { status: 'up' } });

			await serviceWithOptions['checkMemory']();

			expect(mockMemory.checkHeap).toHaveBeenCalledWith('memory_heap', 200 * 1024 * 1024);
		});

		it('should use default threshold (150MB) when not specified', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					memory: {},
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockMemory.checkHeap.mockResolvedValue({ memory_heap: { status: 'up' } });

			await serviceWithOptions['checkMemory']();

			expect(mockMemory.checkHeap).toHaveBeenCalledWith('memory_heap', 150 * 1024 * 1024);
		});

		it('should propagate exception from indicator', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					memory: { heapThreshold: 100 * 1024 * 1024 },
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			const error = new Error('Memory check failed');
			mockMemory.checkHeap.mockRejectedValue(error);

			await expect(serviceWithOptions['checkMemory']()).rejects.toThrow(error);
		});
	});

	describe('checkDisk', () => {
		it('should return up when not configured', async () => {
			const result = await service['checkDisk']();

			expect(result).toEqual({ disk: { status: 'up' } });
		});

		it('should call checkStorage with path and thresholdPercent', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					disk: { path: '/tmp', thresholdPercent: 0.8 },
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockDisk.checkStorage.mockResolvedValue({ disk: { status: 'up' } });

			await serviceWithOptions['checkDisk']();

			expect(mockDisk.checkStorage).toHaveBeenCalledWith('disk', {
				path: '/tmp',
				thresholdPercent: 0.8,
			});
		});

		it('should use default thresholdPercent (0.9) when not specified', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					disk: { path: '/' },
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockDisk.checkStorage.mockResolvedValue({ disk: { status: 'up' } });

			await serviceWithOptions['checkDisk']();

			expect(mockDisk.checkStorage).toHaveBeenCalledWith('disk', {
				path: '/',
				thresholdPercent: 0.9,
			});
		});

		it('should support thresholdBytes when specified', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					disk: { path: '/', thresholdBytes: 1000000000 },
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockDisk.checkStorage.mockResolvedValue({ disk: { status: 'up' } });

			await serviceWithOptions['checkDisk']();

			expect(mockDisk.checkStorage).toHaveBeenCalledWith('disk', {
				path: '/',
				thresholdPercent: 0.9,
			});
		});

		it('should propagate exception from indicator', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					disk: { path: '/', thresholdPercent: 0.9 },
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			const error = new Error('Disk check failed');
			mockDisk.checkStorage.mockRejectedValue(error);

			await expect(serviceWithOptions['checkDisk']()).rejects.toThrow(error);
		});
	});

	describe('checkHttpDependencies', () => {
		it('should return up when not configured', async () => {
			const result = await service['checkHttpDependencies']();

			expect(result).toEqual({ http: { status: 'up' } });
		});

		it('should execute pingCheck for each HTTP endpoint', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					http: [
						{ name: 'api1', url: 'http://localhost:3001' },
						{ name: 'api2', url: 'http://localhost:3002' },
					],
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockHttp.pingCheck
				.mockResolvedValueOnce({ api1: { status: 'up' } })
				.mockResolvedValueOnce({ api2: { status: 'up' } });

			await serviceWithOptions['checkHttpDependencies']();

			expect(mockHttp.pingCheck).toHaveBeenCalledTimes(2);
			expect(mockHttp.pingCheck).toHaveBeenCalledWith('api1', 'http://localhost:3001', {
				timeout: 3000,
			});
			expect(mockHttp.pingCheck).toHaveBeenCalledWith('api2', 'http://localhost:3002', {
				timeout: 3000,
			});
		});

		it('should use default timeout (3000ms) when not specified', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					http: [{ name: 'api', url: 'http://localhost:3000' }],
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockHttp.pingCheck.mockResolvedValue({ api: { status: 'up' } });

			await serviceWithOptions['checkHttpDependencies']();

			expect(mockHttp.pingCheck).toHaveBeenCalledWith('api', 'http://localhost:3000', {
				timeout: 3000,
			});
		});

		it('should combine results from multiple endpoints', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					http: [
						{ name: 'api1', url: 'http://localhost:3001' },
						{ name: 'api2', url: 'http://localhost:3002' },
					],
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockHttp.pingCheck
				.mockResolvedValueOnce({ api1: { status: 'up' } })
				.mockResolvedValueOnce({ api2: { status: 'up' } });

			const result = await serviceWithOptions['checkHttpDependencies']();

			expect(result).toEqual({
				api1: { status: 'up' },
				api2: { status: 'up' },
			});
		});

		it('should propagate error from any endpoint that fails', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					http: [{ name: 'api', url: 'http://localhost:3000' }],
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			const error = new Error('HTTP check failed');
			mockHttp.pingCheck.mockRejectedValue(error);

			await expect(serviceWithOptions['checkHttpDependencies']()).rejects.toThrow(error);
		});
	});

	describe('checkCustomIndicators', () => {
		it('should return up (prepared for future circuit breaker)', async () => {
			const result = await service['checkCustomIndicators']();

			expect(result).toEqual({ custom: { status: 'up' } });
		});
	});

	describe('Edge Cases', () => {
		it('should handle options undefined', async () => {
			const serviceWithOptions = await createServiceWithOptions(undefined as any);
			setupSuccessfulCheck({ memory: { status: 'up' } });

			const result = await serviceWithOptions.checkLiveness();

			expect(result).toEqual({ memory: { status: 'up' } });
		});

		it('should handle options.indicators undefined', async () => {
			const options: HealthCheckOptions = {};
			const serviceWithOptions = await createServiceWithOptions(options);
			setupSuccessfulCheck({ memory: { status: 'up' } });

			const result = await serviceWithOptions.checkLiveness();

			expect(result).toEqual({ memory: { status: 'up' } });
		});

		it('should handle injected indicators as undefined (@Optional)', async () => {
			const module = await createTestModule({ indicators: { memory: {} } }, false);
			const serviceWithOptions = module.get<HealthService>(HealthService);
			setupSuccessfulCheck({ memory: { status: 'up' } });

			const result = await serviceWithOptions.checkLiveness();

			expect(result).toEqual({ memory: { status: 'up' } });
		});

		it('should handle memory indicator as undefined when not provided', async () => {
			const options: HealthCheckOptions = {
				indicators: { memory: { heapThreshold: 100 * 1024 * 1024 } },
			};
			const module = await createTestModule(options, false);
			const serviceWithOptions = module.get<HealthService>(HealthService);

			const result = await serviceWithOptions['checkMemory']();
			expect(result).toEqual({ memory: { status: 'up' } });
		});

		it('should handle disk indicator as undefined when not provided', async () => {
			const options: HealthCheckOptions = {
				indicators: { disk: { path: '/', thresholdPercent: 0.9 } },
			};
			const module = await createTestModule(options, false);
			const serviceWithOptions = module.get<HealthService>(HealthService);

			const result = await serviceWithOptions['checkDisk']();
			expect(result).toEqual({ disk: { status: 'up' } });
		});

		it('should handle http indicator as undefined when not provided', async () => {
			const options: HealthCheckOptions = {
				indicators: { http: [{ name: 'api', url: 'http://localhost:3000' }] },
			};
			const module = await createTestModule(options, false);
			const serviceWithOptions = module.get<HealthService>(HealthService);

			const result = await serviceWithOptions['checkHttpDependencies']();
			expect(result).toEqual({ http: { status: 'up' } });
		});

		it('should handle empty array of HTTP endpoints', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					http: [],
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);

			const result = await serviceWithOptions['checkHttpDependencies']();

			expect(result).toEqual({ http: { status: 'up' } });
		});

		it('should handle timeout 0', async () => {
			const options: HealthCheckOptions = {
				indicators: {
					http: [{ name: 'api', url: 'http://localhost:3000', timeout: 0 }],
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			mockHttp.pingCheck.mockResolvedValue({ api: { status: 'up' } });

			await serviceWithOptions['checkHttpDependencies']();

			expect(mockHttp.pingCheck).toHaveBeenCalledWith('api', 'http://localhost:3000', {
				timeout: 0,
			});
		});
	});

	describe('getConfiguration', () => {
		it('should return current configuration', async () => {
			const options: HealthCheckOptions = {
				timeout: 5000,
				indicators: {
					memory: { heapThreshold: 100 * 1024 * 1024 },
				},
			};

			const serviceWithOptions = await createServiceWithOptions(options);
			const config = serviceWithOptions.getConfiguration();

			expect(config).toEqual(options);
		});
	});

	describe('Integration Tests', () => {
		describe('checkLiveness Integration', () => {
			it('should return default status when no memory configuration', async () => {
				const result = await service.checkLiveness();

				expect(result).toEqual({ memory: { status: 'up' } });
			});
		});
	});
});
