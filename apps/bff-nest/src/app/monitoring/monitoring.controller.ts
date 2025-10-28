import { Log, LogDebug, LogInfo } from '@scouts/logger-node';
import { NestLoggerService } from '@scouts/utils-nest';
import { Controller, Get, Post } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
	constructor(
		private readonly monitoringService: MonitoringService,
		private readonly logger: NestLoggerService
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
