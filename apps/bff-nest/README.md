# bff-nest

This is a NestJS BFF (Backend for Frontend) application that demonstrates the integration of `@scouts/logger-node` through the `@scouts/utils-nest` Logger Module.

## Features

- **Structured Logging**: Full integration with `@scouts/logger-node` for structured, high-performance logging
- **Correlation ID Support**: Automatic correlation ID extraction and context propagation across requests
- **Data Redaction**: Automatic redaction of sensitive fields (password, token, cardNumber, etc.)
- **Metrics Collection**: Optional metrics collection for logging operations
- **Decorator Support**: Full support for `@Log`, `@LogInfo`, `@LogDebug`, `@LogWarn`, `@LogError` decorators
- **Health Monitoring**: Built-in health checks and monitoring endpoints
- **User Management**: CRUD operations for user management with logging examples

## Logger Integration

This application demonstrates the complete integration of `@scouts/logger-node` through the `@scouts/utils-nest` Logger Module, showcasing:

### 1. Logger Module Configuration

```typescript
// app.module.ts
import { LoggerModule, CorrelationIdMiddleware } from '@scouts/utils-nest';

@Module({
  imports: [
    LoggerModule.forRoot({
      service: 'bff-nest',
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      enableMetrics: true,
      redactKeys: ['password', 'token', 'cardNumber']
    })
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
```

### 2. NestJS Logger Service Integration

```typescript
// main.ts
import { NestLoggerService } from '@scouts/utils-nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default NestJS logger
  });
  
  // Use our custom logger service
  const logger = app.get(NestLoggerService);
  app.useLogger(logger);
  
  // Enable CORS with correlation ID header
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['x-correlation-id'],
  });
}
```

### 3. Hybrid Logging Approach

The application demonstrates both NestJS LoggerService and direct `@scouts/logger-node` usage:

```typescript
// app.controller.ts
import { Log } from '@scouts/logger-node';
import { NestLoggerService, LOGGER_TOKEN } from '@scouts/utils-nest';

@Controller()
export class AppController {
  constructor(
    private readonly logger: NestLoggerService, // NestJS LoggerService
    @Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger // Direct logger-node
  ) {}

  @Get()
  @Log({ level: 'info', includeResult: true })
  getData() {
    // Using NestJS LoggerService
    this.logger.log('AppController.getData called', 'AppController');
    
    // Using @scouts/logger-node directly for advanced features
    this.nodeLogger.info('AppController.getData called with correlation ID');
    
    return this.appService.getData();
  }
}
```

## API Endpoints

### Core Endpoints

- `GET /api` - Main application endpoint with logging demonstration
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

### User Management

- `POST /api/users` - Create user (demonstrates data redaction)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/activate` - Activate user
- `POST /api/users/:id/deactivate` - Deactivate user

### Monitoring

- `GET /api/monitoring/metrics` - Logger metrics
- `POST /api/monitoring/test-redaction` - Test data redaction
- `GET /api/monitoring/health` - Health status with logger stats
- `POST /api/monitoring/simulate-error` - Simulate error for testing
- `GET /api/monitoring/logger-stats` - Detailed logger statistics

## Decorator Examples

### Basic Logging Decorators

```typescript
@Controller('users')
export class UsersController {
  @Post()
  @Log({ level: 'info', includeArgs: true, includeResult: true })
  async create(@Body() createUserDto: CreateUserDto) {
    // password field will be automatically redacted in logs
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @LogDebug({ includeArgs: true, includeResult: true })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @LogWarn({ includeArgs: true, includeResult: true })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

### Service Layer Logging

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly logger: NestLoggerService,
    @Inject(LOGGER_TOKEN) private readonly nodeLogger: Logger
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log('Creating new user', 'UsersService');
    
    // Log with sensitive data (will be redacted automatically)
    this.nodeLogger.info('User created successfully', { 
      userId: user.id, 
      userData: createUserDto 
    });

    return user;
  }
}
```

## Data Redaction

The application automatically redacts sensitive fields:

### Default Redacted Fields
- `password`
- `token`
- `cardNumber`
- `ssn`

### Custom Redacted Fields
Additional fields can be specified in the LoggerModule configuration:

```typescript
LoggerModule.forRoot({
  redactKeys: ['password', 'token', 'cardNumber', 'apiKey', 'secret']
})
```

### Testing Redaction

Use the monitoring endpoint to test redaction:

```bash
curl -X POST http://localhost:3000/api/monitoring/test-redaction
```

This will log sensitive data that gets automatically redacted.

## Correlation ID

The application supports correlation ID tracking:

### Automatic Extraction
The middleware automatically extracts correlation ID from headers:
- `x-correlation-id`
- `x-request-id`
- `x-trace-id`
- `correlation-id`
- `request-id`

### Manual Usage
```bash
curl -H "x-correlation-id: my-custom-id" http://localhost:3000/api/users
```

### Response Headers
All responses include the correlation ID in the `x-correlation-id` header.

## Metrics Collection

### Accessing Metrics
```bash
curl http://localhost:3000/api/monitoring/metrics
```

### Metrics Response
```json
{
  "logsWritten": 150,
  "errorCount": 2,
  "uptimeMs": 30000,
  "memoryUsage": {
    "rss": 45,
    "heapTotal": 20,
    "heapUsed": 15
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Logger Statistics
```bash
curl http://localhost:3000/api/monitoring/logger-stats
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Testing
```bash
npm run test
```

## Environment Variables

- `NODE_ENV` - Environment (development, production)
- `PORT` - Server port (default: 3000)
- `SERVICE_NAME` - Service name for logging
- `SERVICE_VERSION` - Service version for logging

## Logging Configuration

The application uses structured JSON logging with the following features:

- **Structured Output**: All logs are in JSON format
- **Correlation ID**: Automatic correlation ID tracking
- **Data Redaction**: Automatic redaction of sensitive fields
- **Metrics**: Optional metrics collection
- **Performance**: High-performance logging with Pino
- **Context**: AsyncLocalStorage for context propagation

## Example Log Output

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "msg": "User created successfully",
  "correlationId": "abc-123-def",
  "service": "bff-nest",
  "environment": "development",
  "version": "1.0.0",
  "userId": "1",
  "userData": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "[REDACTED]",
    "token": "[REDACTED]"
  }
}
```

## Development Notes

- All sensitive fields are automatically redacted
- Correlation ID is propagated through the entire request lifecycle
- Metrics are collected for monitoring
- Structured logging enables easy parsing and analysis
- The hybrid approach allows both NestJS compatibility and advanced logging features

