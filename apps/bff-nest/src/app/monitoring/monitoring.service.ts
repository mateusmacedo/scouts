import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '@scouts/logger-node';
import { LOGGER_TOKEN, NestLoggerService } from '@scouts/utils-nest';

export interface LoggerMetrics {
	logsWritten: number;
	errorCount: number;
	uptimeMs: number;
	memoryUsage: NodeJS.MemoryUsage;
	timestamp: string;
}

export interface RedactionTestData {
	user: {
		name: string;
		email: string;
		password: string;
		token: string;
		cardNumber: string;
		ssn: string;
	};
	apiKey: string;
	secret: string;
}

@Injectable()
export class MonitoringService {
	constructor(
		private readonly logger: NestLoggerService,
		@Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger
	) {}

	getLoggerMetrics(): LoggerMetrics {
		this.logger.debug('Retrieving logger metrics', 'MonitoringService');

		// Check if getMetrics method exists - it's always synchronous
		const metrics =
			typeof this.nodeLogger.getMetrics === 'function' ? this.nodeLogger.getMetrics() : null;

		const memoryUsage = process.memoryUsage();

		return {
			logsWritten: metrics?.logsWritten || 0,
			errorCount: metrics?.errorCount || 0,
			uptimeMs: metrics?.uptimeMs || 0,
			memoryUsage,
			timestamp: new Date().toISOString(),
		};
	}

	testRedaction(): { original: RedactionTestData; redacted: string } {
		this.logger.log('Testing data redaction', 'MonitoringService');

		const testData: RedactionTestData = {
			user: {
				name: 'John Doe',
				email: 'john@example.com',
				password: 'secret123',
				token: 'jwt-token-here',
				cardNumber: '4111-1111-1111-1111',
				ssn: '123-45-6789',
			},
			apiKey: 'sk-1234567890abcdef',
			secret: 'super-secret-key',
		};

		// Log the data - it will be automatically redacted
		this.nodeLogger.info('Testing redaction with sensitive data', {
			testData,
		});

		// Return both original and what would be logged (redacted)
		return {
			original: testData,
			redacted: 'Check logs to see redacted output',
		};
	}

	getHealthStatus(): {
		status: string;
		logger: {
			status: string;
			metrics: LoggerMetrics;
		};
		timestamp: string;
	} {
		this.logger.debug('Checking health status', 'MonitoringService');

		const metrics = this.getLoggerMetrics();

		return {
			status: 'healthy',
			logger: {
				status: 'operational',
				metrics,
			},
			timestamp: new Date().toISOString(),
		};
	}
}
