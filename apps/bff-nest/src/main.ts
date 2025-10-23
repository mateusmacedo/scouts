/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { NestLoggerService } from '@scouts/utils-nest';
import { AppModule } from './app/app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: false, // Disable default NestJS logger
	});

	// Use our custom logger service
	const logger = app.get(NestLoggerService);
	app.useLogger(logger);

	const globalPrefix = 'api';
	app.setGlobalPrefix(globalPrefix);

	// Enable CORS with correlation ID header
	app.enableCors({
		origin: true,
		credentials: true,
		exposedHeaders: ['x-correlation-id'],
	});

	const port = process.env.PORT || 3000;
	await app.listen(port);

	logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`, 'Bootstrap');
	logger.log(`📊 Logger metrics enabled`, 'Bootstrap');
	logger.log(`🔒 Data redaction configured`, 'Bootstrap');
	logger.log(`🔗 Correlation ID middleware active`, 'Bootstrap');
}

bootstrap();

