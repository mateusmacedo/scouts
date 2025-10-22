import { DynamicModule, Type } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';

// ✅ Type-safe security schemes usando discriminated unions
export interface BearerSecurityScheme {
	type: 'bearer';
	scheme: 'bearer';
	bearerFormat?: string; // ex: 'JWT'
}

export interface ApiKeySecurityScheme {
	type: 'apiKey';
	name: string; // ex: 'X-API-KEY'
	in: 'header' | 'query' | 'cookie';
}

export interface OAuth2Flow {
	authorizationUrl?: string;
	tokenUrl?: string;
	refreshUrl?: string;
	scopes?: Record<string, string>;
}

export interface OAuth2SecurityScheme {
	type: 'oauth2';
	flows: {
		implicit?: OAuth2Flow;
		password?: OAuth2Flow;
		clientCredentials?: OAuth2Flow;
		authorizationCode?: OAuth2Flow;
	};
}

export interface BasicSecurityScheme {
	type: 'basic';
}

export type SecuritySchemeConfig =
	| BearerSecurityScheme
	| ApiKeySecurityScheme
	| OAuth2SecurityScheme
	| BasicSecurityScheme;

/**
 * Swagger UI configuration options
 */
export interface SwaggerUIOptions {
	persistAuthorization?: boolean;
	docExpansion?: 'list' | 'full' | 'none';
	filter?: boolean | string;
	displayRequestDuration?: boolean;
	[key: string]: unknown;
}

export interface ServerConfig {
	url: string;
	description?: string;
}

export interface ContactConfig {
	name?: string;
	url?: string;
	email?: string;
}

export interface LicenseConfig {
	name: string;
	url?: string;
}

export interface SwaggerModuleOptions {
	// Configuração básica
	title: string;
	description: string;
	version: string;

	// Configurações opcionais
	path?: string; // default: 'api'
	tags?: string[];
	servers?: ServerConfig[];
	contact?: ContactConfig;
	license?: LicenseConfig;

	// Segurança (Bearer JWT + API Key)
	security?: SecuritySchemeConfig[];

	// Customização de UI
	customCss?: string;
	customSiteTitle?: string;
	customfavIcon?: string;
	swaggerOptions?: SwaggerUIOptions;
	ui?: 'swagger' | 'redoc' | 'scalar'; // ✅ Alternativas de UI

	// Múltiplos documentos
	documents?: DocumentConfig[];

	// Hooks e plugins para extensibilidade
	onDocumentCreated?: (document: OpenAPIObject) => OpenAPIObject | Promise<OpenAPIObject>;
	plugins?: SwaggerPlugin[];
}

// ✅ Alinhado com SwaggerDocumentOptions do @nestjs/swagger
export interface DocumentConfig {
	name: string; // ex: 'v1', 'admin'
	path: string; // ex: 'api/v1', 'api/admin'
	title: string;
	description: string;
	version: string;
	include?: Type<unknown>[]; // Módulos a incluir
	extraModels?: Type<unknown>[]; // ✅ DTOs não descobertos automaticamente
	deepScanRoutes?: boolean; // ✅ Descoberta profunda de rotas
	ignoreGlobalPrefix?: boolean; // ✅ Ignorar prefixo global
	security?: SecuritySchemeConfig[];
}

// ✅ Interface para plugins customizados
export interface SwaggerPlugin {
	name: string;
	apply(document: OpenAPIObject): OpenAPIObject;
}

export interface SwaggerModuleAsyncOptions<T extends SwaggerModuleOptions = SwaggerModuleOptions> {
	imports?: DynamicModule['imports'];
	useFactory: (...args: any[]) => Promise<T> | T;
	inject?: (string | symbol | Type)[];
}
