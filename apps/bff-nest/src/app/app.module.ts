import { HealthModule, LoggerModule, CorrelationIdMiddleware } from '@scouts/utils-nest';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { MonitoringController } from './monitoring/monitoring.controller';
import { MonitoringService } from './monitoring/monitoring.service';

@Module({
	imports: [
		HealthModule.forRoot(), // Configuração básica sem indicadores customizados
		LoggerModule.forRoot({
			service: 'bff-nest',
			environment: process.env.NODE_ENV,
			version: '1.0.0',
			enableMetrics: true,
			redactKeys: ['password', 'token', 'cardNumber'],
		}),
	],
	controllers: [AppController, UsersController, MonitoringController],
	providers: [AppService, UsersService, MonitoringService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(CorrelationIdMiddleware).forRoutes('*');
	}
}
