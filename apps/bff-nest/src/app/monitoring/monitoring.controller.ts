import { Controller, Get, Inject, Post } from '@nestjs/common';
import type { Logger } from '@scouts/logger-node';
import { Log, LogDebug, LogInfo } from '@scouts/logger-node';
import { LOGGER_TOKEN, NestLoggerService } from '@scouts/utils-nest';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
	constructor(
		private readonly monitoringService: MonitoringService,
		private readonly logger: NestLoggerService,
		@Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger
	) {}

	@Get('metrics')
	@LogInfo({ includeResult: true })
	getMetrics() {
		this.logger.debug('Retrieving logger metrics', 'MonitoringController');
		return this.monitoringService.getLoggerMetrics();
	}

	@Post('test-redaction')
	@Log({ level: 'info', includeArgs: true, includeResult: true })
	testRedaction() {
		this.logger.log('Testing data redaction', 'MonitoringController');
		return this.monitoringService.testRedaction();
	}

	@Get('health')
	@LogDebug({ includeResult: true })
	getHealth() {
		this.logger.debug('Checking health status', 'MonitoringController');
		return this.monitoringService.getHealthStatus();
	}


	@Get('logger-stats')
	@LogInfo({ includeResult: true })
	getLoggerStats() {
		this.logger.debug('Retrieving logger statistics', 'MonitoringController');

		const metrics = this.monitoringService.getLoggerMetrics();

		return {
			summary: {
				totalLogs: metrics.logsWritten,
				errors: metrics.errorCount,
				uptime: `${Math.floor(metrics.uptimeMs / 1000)}s`,
				memoryUsage: {
					rss: `${Math.round(metrics.memoryUsage.rss / 1024 / 1024)}MB`,
					heapTotal: `${Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024)}MB`,
					heapUsed: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
				},
			},
			details: metrics,
		};
	}
}
// fake value to change and force affected files
