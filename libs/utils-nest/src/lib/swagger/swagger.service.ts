import { INestApplication, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_OPTIONS_TOKEN } from './constants';
import { DocumentConfig, SecuritySchemeConfig, SwaggerModuleOptions } from './swagger.interface';

/**
 * Service that orchestrates Swagger/OpenAPI configuration and setup
 * Provides centralized configuration and document generation
 */
@Injectable()
export class SwaggerService {
	private readonly logger = new Logger(SwaggerService.name);

	constructor(
		@Inject(SWAGGER_OPTIONS_TOKEN)
		@Optional()
		private readonly options: SwaggerModuleOptions = {} as SwaggerModuleOptions
	) {}

	/**
	 * Setup main Swagger document
	 */
	async setup(app: INestApplication): Promise<void> {
		const startTime = Date.now();
		this.logger.log('Initializing Swagger documentation...');

		try {
			const builder = this.createDocumentBuilder();
			const document = SwaggerModule.createDocument(app, builder.build());

			// Apply plugins if configured
			const processedDocument = this.applyPlugins(document);

			// Apply onDocumentCreated hook if configured
			const finalDocument = this.options.onDocumentCreated
				? await this.options.onDocumentCreated(processedDocument)
				: processedDocument;

			// Setup UI
			const path = this.options.path || 'api';
			const swaggerCustomOptions = this.options.swaggerOptions
				? {
						swaggerOptions: this.options.swaggerOptions,
					}
				: undefined;
			SwaggerModule.setup(path, app, finalDocument, swaggerCustomOptions);

			const duration = Date.now() - startTime;
			this.logger.log(`Document available at /${path} (generated in ${duration}ms)`);
		} catch (error) {
			this.logger.error('Failed to setup Swagger documentation', error);
			throw error;
		}
	}

	/**
	 * Setup multiple Swagger documents
	 */
	async setupMultipleDocuments(app: INestApplication): Promise<void> {
		if (!this.options.documents || this.options.documents.length === 0) {
			this.logger.warn('No documents configured for multiple setup');
			return;
		}

		this.logger.log(`Setting up ${this.options.documents.length} Swagger documents...`);

		for (const docConfig of this.options.documents) {
			await this.setupDocument(app, docConfig);
		}
	}

	/**
	 * Setup a single document
	 */
	private async setupDocument(app: INestApplication, config: DocumentConfig): Promise<void> {
		const startTime = Date.now();

		try {
			const builder = this.createDocumentBuilderForDocument(config);
			const document = SwaggerModule.createDocument(app, builder.build(), {
				include: config.include,
				extraModels: config.extraModels,
				deepScanRoutes: config.deepScanRoutes,
				ignoreGlobalPrefix: config.ignoreGlobalPrefix,
			});

			// Apply document-specific security
			if (config.security) {
				this.applySecuritySchemes(builder, config.security);
			}

			// Apply plugins if configured
			const processedDocument = this.applyPlugins(document);

			// Apply onDocumentCreated hook if configured
			const finalDocument = this.options.onDocumentCreated
				? await this.options.onDocumentCreated(processedDocument)
				: processedDocument;

			SwaggerModule.setup(config.path, app, finalDocument);

			const duration = Date.now() - startTime;
			this.logger.log(
				`Document '${config.name}' available at /${config.path} (generated in ${duration}ms)`
			);
		} catch (error) {
			this.logger.error(`Failed to setup document '${config.name}'`, error);
			throw error;
		}
	}

	/**
	 * Get document as JSON string
	 */
	getDocumentAsJson(app: INestApplication): string {
		const builder = this.createDocumentBuilder();
		const document = SwaggerModule.createDocument(app, builder.build());
		return JSON.stringify(document, null, 2);
	}

	/**
	 * Get document as YAML string
	 */
	getDocumentAsYaml(app: INestApplication): string {
		const yaml = require('js-yaml');
		const document = JSON.parse(this.getDocumentAsJson(app));
		return yaml.dump(document);
	}

	/**
	 * Get current configuration
	 */
	getConfiguration(): SwaggerModuleOptions {
		return this.options;
	}

	/**
	 * Create DocumentBuilder with main configuration
	 */
	private createDocumentBuilder(): DocumentBuilder {
		const builder = new DocumentBuilder()
			.setTitle(this.options.title)
			.setDescription(this.options.description)
			.setVersion(this.options.version);

		// Apply optional configurations
		if (this.options.contact) {
			builder.setContact(
				this.options.contact.name ?? '',
				this.options.contact.url ?? '',
				this.options.contact.email ?? ''
			);
		}

		if (this.options.license) {
			builder.setLicense(this.options.license.name, this.options.license.url ?? '');
		}

		if (this.options.servers) {
			for (const server of this.options.servers) {
				builder.addServer(server.url, server.description);
			}
		}

		if (this.options.tags) {
			for (const tag of this.options.tags) {
				builder.addTag(tag);
			}
		}

		// Apply security schemes
		if (this.options.security) {
			this.applySecuritySchemes(builder, this.options.security);
		}

		return builder;
	}

	/**
	 * Create DocumentBuilder for specific document
	 */
	private createDocumentBuilderForDocument(config: DocumentConfig): DocumentBuilder {
		const builder = new DocumentBuilder()
			.setTitle(config.title)
			.setDescription(config.description)
			.setVersion(config.version);

		// Apply document-specific security
		if (config.security) {
			this.applySecuritySchemes(builder, config.security);
		}

		return builder;
	}

	/**
	 * Apply security schemes to DocumentBuilder
	 */
	private applySecuritySchemes(builder: DocumentBuilder, security: SecuritySchemeConfig[]): void {
		for (const scheme of security) {
			switch (scheme.type) {
				case 'bearer':
					builder.addBearerAuth(
						{ type: 'http', scheme: 'bearer', bearerFormat: scheme.bearerFormat },
						scheme.scheme
					);
					break;
				case 'apiKey':
					builder.addApiKey({ type: 'apiKey', in: scheme.in, name: scheme.name }, scheme.name);
					break;
				case 'oauth2':
					builder.addOAuth2({
						type: 'oauth2',
						flows: {
							implicit: scheme.flows.implicit
								? {
										authorizationUrl: scheme.flows.implicit.authorizationUrl,
										refreshUrl: scheme.flows.implicit.refreshUrl,
										scopes: scheme.flows.implicit.scopes || {},
									}
								: undefined,
							password: scheme.flows.password
								? {
										tokenUrl: scheme.flows.password.tokenUrl,
										refreshUrl: scheme.flows.password.refreshUrl,
										scopes: scheme.flows.password.scopes || {},
									}
								: undefined,
							clientCredentials: scheme.flows.clientCredentials
								? {
										tokenUrl: scheme.flows.clientCredentials.tokenUrl,
										refreshUrl: scheme.flows.clientCredentials.refreshUrl,
										scopes: scheme.flows.clientCredentials.scopes || {},
									}
								: undefined,
							authorizationCode: scheme.flows.authorizationCode
								? {
										authorizationUrl: scheme.flows.authorizationCode.authorizationUrl,
										tokenUrl: scheme.flows.authorizationCode.tokenUrl,
										refreshUrl: scheme.flows.authorizationCode.refreshUrl,
										scopes: scheme.flows.authorizationCode.scopes || {},
									}
								: undefined,
						},
					});
					break;
				case 'basic':
					builder.addBasicAuth();
					break;
			}
		}
	}

	/**
	 * Apply configured plugins to document
	 */
	private applyPlugins(document: OpenAPIObject): OpenAPIObject {
		if (!this.options.plugins || this.options.plugins.length === 0) {
			return document;
		}

		let processedDocument = document;

		for (const plugin of this.options.plugins) {
			this.logger.debug(`Applying plugin: ${plugin.name}`);
			processedDocument = plugin.apply(processedDocument);
		}

		return processedDocument;
	}
}
// fake value to change and force affected files
