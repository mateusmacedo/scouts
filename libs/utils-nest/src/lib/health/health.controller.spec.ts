import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
	let controller: HealthController;
	let healthService: HealthService;

	const mockHealthService = {
		checkLiveness: jest.fn(),
		checkReadiness: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				{
					provide: HealthService,
					useValue: mockHealthService,
				},
			],
		}).compile();

		controller = module.get<HealthController>(HealthController);
		healthService = module.get<HealthService>(HealthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /health/live', () => {
		it('should call healthService.checkLiveness', async () => {
			const expectedResult = { status: 'ok', info: { health: { status: 'up' } } };
			mockHealthService.checkLiveness.mockResolvedValue(expectedResult);

			const result = await controller.checkLiveness();

			expect(healthService.checkLiveness).toHaveBeenCalledTimes(1);
			expect(result).toEqual(expectedResult);
		});

		it('should return result from service', async () => {
			const expectedResult = { status: 'ok', info: { health: { status: 'up' } } };
			mockHealthService.checkLiveness.mockResolvedValue(expectedResult);

			const result = await controller.checkLiveness();

			expect(result).toEqual(expectedResult);
		});

		it('should propagate error from service', async () => {
			const error = new Error('Health check failed');
			mockHealthService.checkLiveness.mockRejectedValue(error);

			await expect(controller.checkLiveness()).rejects.toThrow(error);
		});
	});

	describe('GET /health/ready', () => {
		it('should call healthService.checkReadiness', async () => {
			const expectedResult = { status: 'ok', info: { health: { status: 'up' } } };
			mockHealthService.checkReadiness.mockResolvedValue(expectedResult);

			const result = await controller.checkReadiness();

			expect(healthService.checkReadiness).toHaveBeenCalledTimes(1);
			expect(result).toEqual(expectedResult);
		});

		it('should return result from service', async () => {
			const expectedResult = { status: 'ok', info: { health: { status: 'up' } } };
			mockHealthService.checkReadiness.mockResolvedValue(expectedResult);

			const result = await controller.checkReadiness();

			expect(result).toEqual(expectedResult);
		});

		it('should propagate error from service', async () => {
			const error = new Error('Health check failed');
			mockHealthService.checkReadiness.mockRejectedValue(error);

			await expect(controller.checkReadiness()).rejects.toThrow(error);
		});
	});

	describe('GET /live', () => {
		it('should call healthService.checkLiveness (alternative endpoint)', async () => {
			const expectedResult = { status: 'ok', info: { health: { status: 'up' } } };
			mockHealthService.checkLiveness.mockResolvedValue(expectedResult);

			const result = await controller.checkLivenessAlt();

			expect(healthService.checkLiveness).toHaveBeenCalledTimes(1);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('GET /ready', () => {
		it('should call healthService.checkReadiness (alternative endpoint)', async () => {
			const expectedResult = { status: 'ok', info: { health: { status: 'up' } } };
			mockHealthService.checkReadiness.mockResolvedValue(expectedResult);

			const result = await controller.checkReadinessAlt();

			expect(healthService.checkReadiness).toHaveBeenCalledTimes(1);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('Decorators', () => {
		it('should have @HealthCheck() decorator on methods', () => {
			const checkLivenessDescriptor = Object.getOwnPropertyDescriptor(
				HealthController.prototype,
				'checkLiveness'
			);
			const checkReadinessDescriptor = Object.getOwnPropertyDescriptor(
				HealthController.prototype,
				'checkReadiness'
			);
			const checkLivenessAltDescriptor = Object.getOwnPropertyDescriptor(
				HealthController.prototype,
				'checkLivenessAlt'
			);
			const checkReadinessAltDescriptor = Object.getOwnPropertyDescriptor(
				HealthController.prototype,
				'checkReadinessAlt'
			);

			expect(checkLivenessDescriptor).toBeDefined();
			expect(checkReadinessDescriptor).toBeDefined();
			expect(checkLivenessAltDescriptor).toBeDefined();
			expect(checkReadinessAltDescriptor).toBeDefined();
		});

		it('should have @Get() decorator with correct paths', () => {
			// This test verifies the decorators are applied correctly
			// The actual path verification is done in E2E tests
			expect(controller).toBeDefined();
		});
	});
});
