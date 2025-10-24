// Core
export * from './lib/context';
export * from './lib/logger';
export * from './lib/metrics';
export * from './lib/options';

// Policies (attach functions)
export * from './lib/redactor';
export * from './lib/sink';

// Implementations
export { DefaultRedactor, createRedactor } from './lib/redactor';
export { PinoSinkAdapter, createPinoSink, LogBuffer, ProcessHandlerManager } from './lib/sink/pino';
export { ConsoleSinkAdapter } from './lib/sink/console';
export { SinkDecorator } from './lib/sink/sink.decorator';
export { createSinkForEnvironment } from './lib/sink';
export {
	createLogEntry,
	formatScope,
	formatError,
	enrichFields,
	validateLogEntry,
} from './lib/sink/helpers';
export { MetricsCollector } from './lib/metrics/metrics-collector';
export type { EnhancedLoggerMetrics } from './lib/metrics/metrics-collector';
export { ComposedLogger } from './lib/logger';

// Optional
export { createComposedLogger } from './lib/factory';

// Decorator standalone (FUNCIONAL - executa logging automaticamente)
export { Log, LogInfo, LogDebug, LogWarn, LogError } from './lib/decorator';
export { LOG_META_KEY, getLogMetadata, setLogMetadata } from './lib/decorator';
export type { LogOptions, LogMetadata } from './lib/decorator';

// Utils
export {
	withRetry,
	createRetryWrapper,
	withRetryAndFallback,
	RetryPresets,
} from './lib/retry/retry';
export type { RetryOptions, RetryResult } from './lib/retry/retry';

// Middleware
export {
	createExpressLoggerMiddleware,
	createCorrelationIdMiddleware,
} from './lib/middleware/express.middleware';
export type { ExpressLoggerOptions } from './lib/middleware/express.middleware';
export {
	createFastifyLoggerPlugin,
	createCorrelationIdPlugin,
} from './lib/middleware/fastify.middleware';
export type { FastifyLoggerOptions } from './lib/middleware/fastify.middleware';

// Test Utils
export {
	createTestLogger,
	createMockLogEntry,
	waitForLog,
	waitForLogs,
	logsContain,
	logsContainMessage,
	logsContainLevel,
	setupTestEnvironment,
} from './lib/test-utils/test-helpers';
export type { TestLoggerOptions, CapturedLog } from './lib/test-utils/test-helpers';

// Test commit for workflow validation - lib shared change

