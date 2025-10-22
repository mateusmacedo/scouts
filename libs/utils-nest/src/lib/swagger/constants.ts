/**
 * Constants for Swagger Module
 */

export const SWAGGER_OPTIONS_TOKEN = 'SWAGGER_OPTIONS_TOKEN';

export const DEFAULT_SWAGGER_PATH = 'api';
export const DEFAULT_SWAGGER_TITLE = 'API Documentation';
export const DEFAULT_SWAGGER_VERSION = '1.0';

export const SECURITY_SCHEMES = {
	BEARER: 'bearer',
	API_KEY: 'apiKey',
	OAUTH2: 'oauth2',
	BASIC: 'basic',
} as const;

export const UI_TYPES = {
	SWAGGER: 'swagger',
	REDOC: 'redoc',
	SCALAR: 'scalar',
} as const;

export const EXPORT_FORMATS = {
	JSON: 'json',
	YAML: 'yaml',
} as const;
