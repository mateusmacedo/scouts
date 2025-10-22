import { Injectable, NestMiddleware } from '@nestjs/common';
import { ensureCid, runWithCidAsync } from '@scouts/logger-node';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware for automatic correlation ID handling
 * Extracts correlation ID from headers or generates a new one
 * Uses @scouts/logger-node context for distributed logging
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	/**
	 * Header names to check for correlation ID (in order of preference)
	 */
	private readonly correlationIdHeaders = [
		'x-correlation-id',
		'x-request-id',
		'x-trace-id',
		'correlation-id',
		'request-id',
	];

	use(req: Request, res: Response, next: NextFunction): void {
		// Extract correlation ID from headers
		const correlationId = this.extractCorrelationId(req);

		// Run the request handler with correlation ID context
		runWithCidAsync(async () => {
			// Add correlation ID to response headers for client tracking
			res.setHeader('x-correlation-id', correlationId);

			// Continue to next middleware/handler
			next();
		}, correlationId);
	}

	/**
	 * Extract correlation ID from request headers
	 */
	private extractCorrelationId(req: Request): string {
		// Check headers in order of preference
		for (const headerName of this.correlationIdHeaders) {
			const headerValue = req.headers[headerName] as string;
			if (headerValue) {
				return ensureCid(headerValue);
			}
		}

		// Generate new correlation ID if none found
		return ensureCid();
	}
}
