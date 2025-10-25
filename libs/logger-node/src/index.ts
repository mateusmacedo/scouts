// Core
export * from './lib/context';
export type { LogMetadata, LogOptions } from './lib/decorator';
// Decorator standalone (FUNCIONAL - executa logging automaticamente)
export {
	getLogMetadata,
	LOG_META_KEY,
	Log,
	LogDebug,
	LogError,
	LogInfo,
	LogWarn,
	setLogMetadata,
} from './lib/decorator';
// Optional
export { createComposedLogger } from './lib/factory';
export * from './lib/logger';
export { ComposedLogger } from './lib/logger';
export * from './lib/metrics';
export type { EnhancedLoggerMetrics } from './lib/metrics/metrics-collector';
export { MetricsCollector } from './lib/metrics/metrics-collector';
export type { ExpressLoggerOptions } from './lib/middleware/express.middleware';
// Middleware
export {
	createCorrelationIdMiddleware,
	createExpressLoggerMiddleware,
} from './lib/middleware/express.middleware';
export type { FastifyLoggerOptions } from './lib/middleware/fastify.middleware';
export {
	createCorrelationIdPlugin,
	createFastifyLoggerPlugin,
} from './lib/middleware/fastify.middleware';
export * from './lib/options';
// Policies (attach functions)
export * from './lib/redactor';
// Implementations
export { createRedactor, DefaultRedactor } from './lib/redactor';
export type { RetryOptions, RetryResult } from './lib/retry/retry';
// Utils
export {
	createRetryWrapper,
	RetryPresets,
	withRetry,
	withRetryAndFallback,
} from './lib/retry/retry';
export * from './lib/sink';
export { createSinkForEnvironment } from './lib/sink';
export { ConsoleSinkAdapter } from './lib/sink/console';
export {
	createLogEntry,
	enrichFields,
	formatError,
	formatScope,
	validateLogEntry,
} from './lib/sink/helpers';
export { createPinoSink, LogBuffer, PinoSinkAdapter, ProcessHandlerManager } from './lib/sink/pino';
export { SinkDecorator } from './lib/sink/sink.decorator';
export type { CapturedLog, TestLoggerOptions } from './lib/test-utils/test-helpers';
// Test Utils
export {
	createMockLogEntry,
	createTestLogger,
	logsContain,
	logsContainLevel,
	logsContainMessage,
	setupTestEnvironment,
	waitForLog,
	waitForLogs,
} from './lib/test-utils/test-helpers';

// Test commit for workflow validation - lib shared change
