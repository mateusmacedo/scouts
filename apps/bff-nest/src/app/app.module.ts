import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CorrelationIdMiddleware, HealthModule, LoggerModule } from '@scouts/utils-nest';
import { UserService } from '@scouts/user-node';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MonitoringController } from './monitoring/monitoring.controller';
import { MonitoringService } from './monitoring/monitoring.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

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
        providers: [AppService, UsersService, MonitoringService, UserService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(CorrelationIdMiddleware).forRoutes('*');
	}
}

