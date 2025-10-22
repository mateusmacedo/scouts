# logger-node

Biblioteca de logging modular e desacoplada para Node.js, construída com padrão de composição via Proxy.

## Características

- **Modular**: Funcionalidades podem ser compostas independentemente
- **Desacoplado**: Sem dependências diretas entre módulos
- **Type-safe**: Totalmente tipado com TypeScript
- **Flexível**: Suporte a diferentes implementações de sink e redactor
- **Performático**: Uso de Proxy para interceptação eficiente

## Composição de Funcionalidades

O `logger-node` usa um padrão de composição via Proxy que permite adicionar funcionalidades de forma modular e desacoplada.

### Uso Básico

```typescript
import { 
  createLogger, 
  attachMetrics, 
  attachRedactor, 
  attachSink 
} from '@scouts/logger-node';

// Criar logger base
let logger = createLogger({ level: 'info' });

// Adicionar métricas
logger = attachMetrics(logger);

// Adicionar redação de dados sensíveis
const redactor = createRedactor({ keys: ['password', 'token'] });
logger = attachRedactor(logger, redactor);

// Adicionar sink para destino de logs
const sink = createConsoleSink();
logger = attachSink(logger, sink, {
  service: 'my-service',
  environment: 'production',
  version: '1.0.0'
});

// Usar logger com todas as funcionalidades
await logger.info('User logged in', { user: 'john', password: 'secret' });
// Output: User logged in { user: 'john', password: '[REDACTED]' }
```

### Ordem de Composição

A ordem de composição determina o fluxo de processamento:

1. **metrics → redactor → sink**: Métricas contam antes de redação
2. **redactor → sink → metrics**: Redação antes de enviar ao sink
3. **sink → redactor → metrics**: Sink recebe dados não redatados

**Recomendação**: `metrics → redactor → sink`

### Exemplos de Composição

```typescript
// Logger simples com sink
let logger = createLogger();
logger = attachSink(logger, consoleSink);

// Logger com redação de senhas
let logger = createLogger();
const redactor = createRedactor({ keys: ['password', 'token'] });
logger = attachRedactor(logger, redactor);
logger = attachSink(logger, fileSink);

// Logger completo com métricas
let logger = createLogger();
logger = attachMetrics(logger);
logger = attachRedactor(logger, redactor);
logger = attachSink(logger, sink);
```

## Context Module - Correlation ID Tracking

O módulo de contexto fornece rastreamento de correlation IDs usando AsyncLocalStorage para logging distribuído.

### Uso Básico

```typescript
import { getCid, runWithCid, runWithCidAsync, ensureCid } from '@scouts/logger-node';

// Executar função com CID específico
const result = runWithCid(() => {
  const cid = getCid(); // Retorna o CID do contexto atual
  return { cid, data: 'processed' };
}, 'req-123');

// Executar função async com CID
const asyncResult = await runWithCidAsync(async () => {
  const cid = getCid();
  await someAsyncOperation();
  return { cid, result: 'done' };
}, 'req-456');

// Garantir CID válido (normalização segura)
const cid = ensureCid('  valid-cid  '); // Retorna 'valid-cid' (trimmed)
const newCid = ensureCid('invalid@#$'); // Gera novo UUID
```

### Framework Integration Patterns

#### Express.js Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import { runWithCidAsync } from '@scouts/logger-node';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const cid = req.headers['x-correlation-id'] as string || 
              req.headers['x-request-id'] as string;
  
  runWithCidAsync(async () => {
    next();
  }, cid);
}
```

#### Fastify Hook

```typescript
import { FastifyInstance } from 'fastify';
import { runWithCidAsync } from '@scouts/logger-node';

export async function registerCorrelationId(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    const cid = request.headers['x-correlation-id'] as string;
    await runWithCidAsync(async () => {
      // Request handlers will have access to getCid()
    }, cid);
  });
}
```

#### NestJS Middleware

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { runWithCidAsync } from '@scouts/logger-node';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const cid = req.headers['x-correlation-id'] as string;
    
    await runWithCidAsync(async () => {
      next();
    }, cid);
  }
}

// app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
```

#### NestJS Interceptor para Logger Bindings

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { getCid } from '@scouts/logger-node';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cid = getCid();
    
    // Bind CID to logger context (example with custom logger)
    if (cid) {
      // logger.setContext({ cid });
    }
    
    return next.handle();
  }
}
```

### OpenTelemetry Bridge (Preparado)

```typescript
import { trace } from '@opentelemetry/api';
import { getCid } from '@scouts/logger-node';

// Função para vincular CID ao span ativo
export function setCidInSpan(): void {
  const cid = getCid();
  const span = trace.getActiveSpan();
  
  if (cid && span) {
    span.setAttribute('correlation.id', cid);
  }
}

// Usar em middleware/interceptor
export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  runWithCidAsync(async () => {
    setCidInSpan(); // Vincula CID ao span OTel
    next();
  }, req.headers['x-correlation-id'] as string);
}
```

### Segurança e Normalização

O `ensureCid` aplica normalização segura por padrão:

- **Trim**: Remove espaços nas bordas
- **Whitelist**: Apenas `[A-Za-z0-9._:-]` permitidos
- **Limite**: Máximo 128 caracteres
- **Rejeição**: Caracteres de controle e especiais geram novo UUID

```typescript
// Exemplos de normalização
ensureCid('  valid-cid  ');     // → 'valid-cid'
ensureCid('invalid@#$');       // → 'uuid-gerado'
ensureCid('a'.repeat(200));    // → 'a'.repeat(128)
ensureCid('cid\nwith\r\n');    // → 'uuid-gerado'
```

### Configuração Avançada

```typescript
// Charset customizado
ensureCid('VALID123', { charset: /^[A-Z0-9]+$/ });

// Tamanho customizado
ensureCid('long-cid', { maxLen: 50 });

// Gerador ULID (requer peer dependency 'ulid')
ensureCid('test', { generator: 'ulid' });
```

### Notas sobre Decorators e Metadados

⚠️ **Importante**: Ao criar decorators que envolvem métodos, preserve os metadados do NestJS:

```typescript
// ❌ Evitar: Proxy que quebra metadados
function badDecorator(target: any, key: string, descriptor: PropertyDescriptor) {
  return new Proxy(descriptor.value, {
    apply: (fn, thisArg, args) => {
      return runWithCid(fn.bind(thisArg), getCid());
    }
  });
}

// ✅ Correto: Preservar metadados
function goodDecorator(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    return runWithCid(() => original.apply(this, args), getCid());
  };
  
  // Preservar metadados do NestJS
  const metadataKeys = Reflect.getMetadataKeys(target, key);
  metadataKeys.forEach(metaKey => {
    const value = Reflect.getMetadata(metaKey, target, key);
    Reflect.defineMetadata(metaKey, value, descriptor.value, key);
  });
  
  return descriptor;
}
```

## API Reference

### Context Functions

- `getCid(): string | undefined` - Obtém CID do contexto atual
- `runWithCid<T>(fn: () => T, cid?: string): T` - Executa função com CID
- `runWithCidAsync<T>(fn: () => Promise<T>, cid?: string): Promise<T>` - Executa função async com CID
- `ensureCid(input?: string | string[], opts?: EnsureOpts): string` - Garante CID válido com normalização

### attachMetrics(logger, collector?, options?)

Adiciona coleta de métricas ao logger.

### attachRedactor(logger, redactor)

Adiciona redação de dados sensíveis ao logger.

### attachSink(logger, sink, options?)

Adiciona destino de logs ao logger.

## Building

Run `nx build logger-node` to build the library.

## Running unit tests

Run `nx test logger-node` to execute the unit tests via [Jest](https://jestjs.io).

