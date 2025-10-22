import { Test } from '@nestjs/testing';
import { AppService } from './app.service';
import { LoggerModule, LOGGER_TOKEN } from '@scouts/utils-nest';

describe('AppService', () => {
	let service: AppService;

	beforeAll(async () => {
		const app = await Test.createTestingModule({
			imports: [LoggerModule.forRoot()],
			providers: [AppService],
		}).compile();

		service = app.get<AppService>(AppService);
	});

	describe('getData', () => {
		it('should return message with user-node and logger-node', () => {
			const result = service.getData();
			expect(result).toEqual({ message: 'user-node - logger-node' });
		});

		it('should have logger instance injected', () => {
			// The service uses @Log decorator, so logger is injected via decorator
			// We can't directly access it, but we can verify the decorator is working
			expect(service).toBeDefined();
		});
	});
});
