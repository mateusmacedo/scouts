// Core interfaces

// Implementations
export { ConsoleSinkAdapter } from './console/console-sink.adapter';
// Helpers
export {
	createLogEntry,
	enrichFields,
	formatError,
	formatScope,
	validateLogEntry,
} from './helpers';
export { createPinoSink, PinoSinkAdapter } from './pino/pino-sink.factory';
export type { LoggerWithSink, Sink, SinkOptions } from './sink';
// Factory
export { createSinkForEnvironment } from './sink';
// Decorator
export { SinkDecorator } from './sink.decorator';
