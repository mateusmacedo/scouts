import { Inject, Injectable, LoggerService, LogLevel } from '@nestjs/common';
import type { Logger } from '@scouts/logger-node';
import { LOGGER_TOKEN } from './constants';

/**
 * NestJS Logger Service that adapts @scouts/logger-node to NestJS LoggerService
 * Provides seamless integration with NestJS logging system
 */
@Injectable()
export class NestLoggerService implements LoggerService {
	constructor(@Inject(LOGGER_TOKEN) private readonly logger: Logger) {}

	/**
	 * Write a 'log' level message
	 */
	log(message: string, context?: string): void {
		void this.logger.info(message, { context });
	}

	/**
	 * Write an 'error' level message
	 */
	error(message: string, trace?: string, context?: string): void {
		void this.logger.error(message, { trace, context });
	}

	/**
	 * Write a 'warn' level message
	 */
	warn(message: string, context?: string): void {
		void this.logger.warn(message, { context });
	}

	/**
	 * Write a 'debug' level message
	 */
	debug(message: string, context?: string): void {
		void this.logger.debug(message, { context });
	}

	/**
	 * Write a 'verbose' level message
	 */
	verbose(message: string, context?: string): void {
		void this.logger.debug(message, { context });
	}

	/**
	 * Write a 'fatal' level message
	 */
	fatal(message: string, context?: string): void {
		void this.logger.fatal(message, { context });
	}

	/**
	 * Set log levels (for compatibility with NestJS LoggerService)
	 * Note: This is a no-op as @scouts/logger-node handles levels differently
	 */
	setLogLevels?(_levels: LogLevel[]): void {
		// No-op: @scouts/logger-node handles log levels through configuration
	}

	/**
	 * Get the underlying logger instance for advanced usage
	 */
	getLogger(): Logger {
		return this.logger;
	}
}
