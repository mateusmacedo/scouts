import type { LogEntry } from '../../logger/logger';
import type { Redactor } from '../../redactor/redactor';
import type { Sink } from '../../sink/sink';

/**
 * Fake Clock para testes determinísticos
 */
export interface Clock {
	now(): number;
}

export class FakeClock implements Clock {
	private t: number;
	constructor(start: number = 1_700_000_000_000) {
		this.t = start;
	}
	now() {
		return this.t;
	}
	tick(ms: number) {
		this.t += ms;
	}
}

/**
 * Fake Sink para capturar e inspecionar logs escritos
 */
export class FakeSink implements Sink {
	public writes: LogEntry[] = [];
	public flushed = 0;
	public closed = 0;

	write(entry: LogEntry): void {
		this.writes.push(entry);
	}

	flush(): void {
		this.flushed++;
	}

	close(): void {
		this.closed++;
	}
}

/**
 * Fake Redactor para capturar e inspecionar dados redatados
 */
export class FakeRedactor implements Redactor {
	public calls: unknown[] = [];

	constructor(private readonly replacer: (data: any) => any = (data) => data) {}

	redact(data: unknown): Promise<unknown> {
		this.calls.push(data);
		return this.replacer(data);
	}

	addPattern(): void {}
	addKey(): void {}
}

/**
 * Helper para criar redactor que substitui campos específicos
 */
export function createPasswordRedactor(): FakeRedactor {
	return new FakeRedactor((data: any) => {
		if (data && typeof data === 'object') {
			const result = { ...data };
			if ('password' in result) {
				result.password = '[REDACTED]';
			}
			return result;
		}
		return data;
	});
}

/**
 * Helper para criar sink que falha propositalmente
 */
export function createFailingSink(error: Error = new Error('disk-full')): Sink {
	return {
		write: () => {
			throw error;
		},
		flush: () => {},
		close: () => {},
	};
}
