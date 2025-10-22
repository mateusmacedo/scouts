# utils-nest

Biblioteca de utilitários para NestJS com módulos de health checks, swagger e logging integrado.

## Características

- **Health Checks**: Módulo completo de health checks com Terminus
- **Swagger**: Configuração avançada de documentação OpenAPI
- **Logger Integration**: Adapter para `@scouts/logger-node` com NestJS
- **Type-Safe**: Totalmente tipado com TypeScript
- **Modular**: Arquitetura modular para fácil extensão

## Instalação

```bash
npm install @scouts/utils-nest @nestjs/terminus @nestjs/swagger @scouts/logger-node
```

## Building

```bash
# Build da biblioteca
pnpm nx build utils-nest

# Build com watch mode
pnpm nx build utils-nest --watch
```

## Running unit tests

```bash
# Executar testes
pnpm nx test utils-nest

# Testes com coverage
pnpm nx test utils-nest --coverage

# Testes em watch mode
pnpm nx test utils-nest --watch
```

## Health Check Module

The `utils-nest` library provides a simple and pragmatic health check module built on top of `@nestjs/terminus`. This module offers essential health checks for HTTP endpoints, memory usage, and disk space with a clean, composable architecture.

### Features

- **Simple Architecture**: 1 controller + 1 service com injeção direta de indicadores Terminus
- **Essential Indicators**: HTTP, Memory, and Disk health checks
- **Kubernetes Compatible**: Support for `/health/live` (liveness) and `/health/ready` (readiness) endpoints
- **Test Coverage**: >75% lines, >65% branches (em desenvolvimento para 80%+)

### Installation

```bash
npm install @scouts/utils-nest @nestjs/terminus @nestjs/axios
```

### Basic Usage

```typescript
import { Module } from '@nestjs/common';
import { HealthModule } from '@scouts/utils-nest';

@Module({
  imports: [
    HealthModule.forRoot({
      indicators: {
        memory: { heapThreshold: 150 * 1024 * 1024 }, // 150MB
        disk: { path: '/', thresholdPercent: 0.9 }, // 90%
      },
    }),
  ],
})
export class AppModule {}
```

### HTTP Dependencies Check

```typescript
import { Module } from '@nestjs/common';
import { HealthModule } from '@scouts/utils-nest';

@Module({
  imports: [
    HealthModule.forRoot({
      indicators: {
        http: [
          { name: 'api-users', url: 'http://localhost:3001/health' },
          { name: 'api-orders', url: 'http://localhost:3002/health' }
        ],
        memory: { heapThreshold: 100 * 1024 * 1024 }, // 100MB
        disk: { path: '/', thresholdPercent: 0.85 }, // 85%
      },
    }),
  ],
})
export class AppModule {}
```

### Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from '@scouts/utils-nest';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HealthModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        indicators: {
          http: configService.get('HEALTH_HTTP_ENDPOINTS', []),
          memory: {
            heapThreshold: configService.get('HEALTH_MEMORY_THRESHOLD', 150 * 1024 * 1024),
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```


### Endpoints

The health check module provides the following endpoints:

- `GET /health/live` - Liveness probe (basic health check)
- `GET /health/ready` - Readiness probe (comprehensive health check)
- `GET /live` - Alternative liveness endpoint
- `GET /ready` - Alternative readiness endpoint

### Response Format

```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "disk": { "status": "up" },
    "api-users": { "status": "up" },
    "custom": { "status": "up" }
  }
}
```

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "health": {
      "status": "down",
      "message": "Service unavailable"
    }
  }
}
```

### Configuration Options

#### HealthCheckOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `timeout` | `number` | `3000` | Global timeout in milliseconds (não implementado) |
| `indicators` | `object` | `{}` | Health indicator configurations |

#### HttpIndicatorConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Indicator name |
| `url` | `string` | Yes | HTTP endpoint URL |
| `timeout` | `number` | No | Request timeout in milliseconds (default: 3000) |

#### MemoryIndicatorConfig

| Property | Type | Description |
|----------|------|-------------|
| `heapThreshold` | `number` | Heap memory threshold in bytes (default: 150MB) |
| `rssThreshold` | `number` | RSS memory threshold in bytes |

#### DiskIndicatorConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `path` | `string` | Yes | Disk path to check |
| `thresholdPercent` | `number` | No | Threshold as percentage (default: 0.9) |
| `thresholdBytes` | `number` | No | Threshold in bytes |

### Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { HealthModule } from '@scouts/utils-nest';

describe('HealthModule', () => {
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [HealthModule.forRoot()],
    }).compile();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
```

## Swagger Module

The `utils-nest` library provides a comprehensive Swagger/OpenAPI configuration module with type-safe security schemes and custom decorators.

### Features

- **Type-Safe Configuration**: Discriminated unions for security schemes
- **Custom Decorators**: Reduce boilerplate in API documentation
- **Multiple Documents**: Support for API versioning and domain separation
- **Extensibility**: Hooks and plugins for custom transformations
- **Export Support**: Generate JSON/YAML for CI/CD and codegen

### Installation

```bash
npm install @scouts/utils-nest @nestjs/swagger
```

### Basic Usage

```typescript
import { SwaggerModule } from '@scouts/utils-nest';

@Module({
  imports: [
    SwaggerModule.forRoot({
      title: 'My API',
      description: 'API Description',
      version: '1.0',
      path: 'api-docs',
      security: [
        { type: 'bearer', scheme: 'bearer', bearerFormat: 'JWT' },
        { type: 'apiKey', name: 'X-API-KEY', in: 'header' }
      ]
    })
  ]
})
export class AppModule {}
```

### Setup in main.ts

```typescript
import { SwaggerService } from '@scouts/utils-nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const swaggerService = app.get(SwaggerService);
  await swaggerService.setup(app);
  
  await app.listen(3000);
}
```

### Custom Decorators

```typescript
import { 
  ApiController, 
  ApiStandardResponse,
  ApiPaginatedResponse,
  ApiSecurityBearer 
} from '@scouts/utils-nest';

@ApiController('users', 'User Management')
export class UserController {
  @Get()
  @ApiSecurityBearer()
  @ApiPaginatedResponse(UserDto)
  findAll() {
    // ...
  }
  
  @Post()
  @ApiSecurityBearer()
  @ApiStandardResponse(UserDto, 201)
  create(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

### Multiple Documents

```typescript
SwaggerModule.forRoot({
  title: 'My API',
  version: '1.0',
  documents: [
    {
      name: 'v1',
      path: 'api/v1',
      title: 'API v1',
      description: 'Version 1 endpoints',
      version: '1.0',
      include: [UsersModuleV1]
    }
  ]
})
```

### Export for CI/CD

```typescript
const swaggerService = app.get(SwaggerService);
const json = swaggerService.getDocumentAsJson(app);
await fs.writeFile('./swagger-spec.json', json);
```

## Logger Module

The `utils-nest` library provides a comprehensive logging module built on top of `@scouts/logger-node`. This module offers structured logging with correlation ID support, automatic redaction, metrics collection, and seamless NestJS integration.

### Features

- **NestJS Integration**: Adapter for NestJS LoggerService with full compatibility
- **Correlation ID Support**: Automatic correlation ID extraction and context propagation
- **Data Redaction**: Automatic redaction of sensitive fields (password, token, etc.)
- **Metrics Collection**: Optional metrics collection for logging operations
- **Decorator Support**: Full support for `@Log`, `@LogInfo`, `@LogDebug`, `@LogWarn`, `@LogError` decorators
- **Async Context**: Proper async context handling with AsyncLocalStorage

### Installation

```bash
npm install @scouts/utils-nest @scouts/logger-node
```

### Basic Usage

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@scouts/utils-nest';

@Module({
  imports: [
    LoggerModule.forRoot({
      service: 'my-service',
      environment: 'production',
      version: '1.0.0',
      enableMetrics: true,
      redactKeys: ['password', 'token', 'cardNumber']
    })
  ]
})
export class AppModule {}
```

### Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@scouts/utils-nest';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        service: configService.get('SERVICE_NAME', 'my-service'),
        environment: configService.get('NODE_ENV', 'development'),
        version: configService.get('SERVICE_VERSION', '1.0.0'),
        enableMetrics: configService.get('LOGGER_METRICS', false),
        redactKeys: configService.get('LOGGER_REDACT_KEYS', '').split(',').filter(Boolean)
      }),
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}
```

### Using the Logger Service

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { NestLoggerService, LOGGER_TOKEN } from '@scouts/utils-nest';
import type { Logger } from '@scouts/logger-node';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: NestLoggerService,
    @Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger
  ) {}

  async createUser(userData: any) {
    // Using NestJS LoggerService
    this.logger.log('Creating user', 'UserService');
    
    // Using @scouts/logger-node directly for advanced features
    this.nodeLogger.info('User creation started', { userId: userData.id });
    
    // Your business logic here
    return { success: true };
  }
}
```

### Using Decorators

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { Log, LogInfo, LogError } from '@scouts/logger-node';

@Controller('users')
export class UserController {
  @Post()
  @Log({ level: 'info', includeArgs: true, includeResult: true })
  async create(@Body() userData: CreateUserDto) {
    // password field will be automatically redacted
    return this.userService.create(userData);
  }

  @Get(':id')
  @LogInfo({ includeArgs: true })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
```

### Correlation ID Middleware

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerModule, CorrelationIdMiddleware } from '@scouts/utils-nest';

@Module({
  imports: [LoggerModule.forRoot()]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
```

### Accessing Metrics

```typescript
import { Controller, Get, Inject } from '@nestjs/common';
import { LOGGER_TOKEN } from '@scouts/utils-nest';
import type { Logger } from '@scouts/logger-node';

@Controller('monitoring')
export class MonitoringController {
  constructor(@Inject(LOGGER_TOKEN) private readonly logger: Logger) {}

  @Get('metrics')
  getMetrics() {
    return this.logger.getMetrics(); // { logsWritten, errorCount, uptimeMs, ... }
  }
}
```

### Configuration Options

#### NestLoggerModuleOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enableMetrics` | `boolean` | `false` | Enable metrics collection |
| `redactKeys` | `string[]` | `[]` | Additional keys to redact beyond defaults |
| `service` | `string` | `process.env.SERVICE_NAME \|\| 'nestjs-app'` | Service name for log enrichment |
| `environment` | `string` | `process.env.NODE_ENV \|\| 'development'` | Environment for log enrichment |
| `version` | `string` | `process.env.SERVICE_VERSION \|\| '1.0.0'` | Version for log enrichment |
| `logLevel` | `LogLevel` | `'info'` | Default log level |

### Default Redacted Fields

The logger automatically redacts the following fields:
- `password`
- `token`
- `cardNumber`
- `ssn`

Additional fields can be specified in the `redactKeys` option.

### Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@scouts/utils-nest';

describe('LoggerModule', () => {
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()]
    }).compile();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
```

## Roadmap / Funcionalidades Futuras

### Custom Health Indicators

> ⚠️ **PLANEJADO**: Esta funcionalidade será implementada em versão futura.

A interface `CustomHealthIndicator` está preparada para integração futura com circuit breakers:

```typescript
import { Injectable } from '@nestjs/common';
import { CustomHealthIndicator } from '@scouts/utils-nest';

@Injectable()
export class DatabaseHealthIndicator implements CustomHealthIndicator {
  async check() {
    try {
      const isConnected = await this.checkDatabaseConnection();
      return { database: { status: isConnected ? 'up' : 'down' } };
    } catch (error) {
      return { database: { status: 'down', error: error.message } };
    }
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    // Your database health check logic
    return true;
  }
}
```

**Funcionalidades planejadas:**
- Integração automática de custom indicators no HealthService
- Suporte a circuit breakers
- Configuração dinâmica de custom indicators

