import { Request } from 'express';

/**
 * Interface para estender o Request do Express com propriedades customizadas
 */
export interface CustomRequest extends Request {
	correlationId?: string;
	logger?: {
		info: (message: string, fields?: Record<string, unknown>) => void;
		debug: (message: string, fields?: Record<string, unknown>) => void;
		warn: (message: string, fields?: Record<string, unknown>) => void;
		error: (message: string, fields?: Record<string, unknown>) => void;
	};
}

/**
 * Interface para campos de log estruturado
 */
export interface LogFields {
	[key: string]: unknown;
}
