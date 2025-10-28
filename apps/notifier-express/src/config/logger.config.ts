import { createComposedLogger, createRedactor } from '@scouts/logger-node';

/**
 * Configuração centralizada do logger composto
 * Demonstra composição manual: metrics → redactor → sink
 */
export function createLogger() {
	return createComposedLogger({
		enableMetrics: true,
		redactor: createRedactor({
			keys: [
				'password',
				'token',
				'email',
				'phone',
				'ssn',
				'cardNumber',
				'apiKey',
				'secret',
				'authorization',
			],
		}),
		sinkOptions: {
			service: 'notifier-express',
			environment: process.env['NODE_ENV'] || 'development',
			version: '1.0.0',
		},
	});
}

/**
 * Configuração de redaction para dados sensíveis
 */
export const SENSITIVE_KEYS = [
	'password',
	'token',
	'email',
	'phone',
	'ssn',
	'cardNumber',
	'apiKey',
	'secret',
	'authorization',
	'x-api-key',
	'x-auth-token',
];

/**
 * Configuração de métricas
 */
export const METRICS_CONFIG = {
	enableMetrics: true,
	trackPerformance: true,
	trackErrors: true,
	trackRequests: true,
};
