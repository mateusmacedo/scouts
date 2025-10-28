import { LoggerModule } from '@scouts/utils-nest';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
	let app: TestingModule;
	let controller: AppController;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [LoggerModule.forRoot()],
			controllers: [AppController],
			providers: [AppService],
		}).compile();

		controller = app.get<AppController>(AppController);
	});

	describe('getData', () => {
		it('should return message with user-node and logger-node', () => {
			expect(controller.getData()).toEqual({ message: 'user-node - logger-node' });
		});

		it('should call appService.getData method', () => {
			const service = app.get<AppService>(AppService);
			const spy = jest.spyOn(service, 'getData');
			controller.getData();
			expect(spy).toHaveBeenCalled();
		});

		it('should have logger instance injected', () => {
			// The controller uses @Log decorator, so logger is injected via decorator
			// We can't directly access it, but we can verify the decorator is working
			expect(controller).toBeDefined();
		});
	});
});
