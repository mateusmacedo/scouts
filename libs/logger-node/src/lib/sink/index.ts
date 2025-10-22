// Core interfaces
export type { Sink, SinkOptions, LoggerWithSink } from './sink';

// Factory
export { createSinkForEnvironment } from './sink';

// Decorator
export { SinkDecorator } from './sink.decorator';

// Helpers
export {
	createLogEntry,
	formatScope,
	formatError,
	enrichFields,
	validateLogEntry,
} from './helpers';

// Implementations
export { ConsoleSinkAdapter } from './console/console-sink.adapter';
export { PinoSinkAdapter, createPinoSink } from './pino/pino-sink.factory';
