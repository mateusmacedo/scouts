# Arquitetura do Template Nx TypeScript/Go

## Visão Geral

Este template implementa uma arquitetura híbrida que combina tecnologias TypeScript/Node.js e Go, gerenciada pelo Nx para otimizar o desenvolvimento e deployment. A arquitetura segue princípios de Clean Architecture, Domain-Driven Design (DDD) e microserviços.

## Estrutura do Template

```
template/
├── apps/                          # Aplicações
│   ├── [nest-app]/               # Aplicação NestJS
│   ├── [go-service]/             # Serviço Go
│   └── [express-app]/            # Aplicação Express
├── libs/                         # Bibliotecas compartilhadas
│   ├── [domain-lib]/            # Biblioteca de domínio (TypeScript)
│   ├── [go-lib]/                # Biblioteca Go
│   ├── [infrastructure-lib]/    # Biblioteca de infraestrutura
│   └── [shared-config]/         # Configurações compartilhadas
├── docs/                         # Documentação
│   ├── ARCHITECTURE.md          # Este arquivo
│   ├── TAG_SYSTEM.md            # Sistema de tags
│   └── [outros guias]           # Guias técnicos
└── scripts/                      # Scripts de automação
```

## Sistema de Tags Multidimensionais

O workspace utiliza um sistema de tags sofisticado para controle de dependências e arquitetura limpa.

> **📋 Para detalhes completos, consulte [Sistema de Tags](TAG_SYSTEM.md)**

### Dimensões de Tags (Resumo)
| Dimensão | Valores | Propósito |
|----------|---------|-----------|
| `type` | `app`, `lib` | Tipo do projeto |
| `scope` | `internal`, `notifier` | Contexto organizacional |
| `runtime` | `node`, `go`, `universal` | Ambiente de execução |
| `layer` | `domain`, `application`, `infrastructure` | Camada arquitetural |
| `visibility` | `public`, `private`, `internal` | Visibilidade do projeto |
| `platform` | `nest`, `express` | Plataforma específica |

## Arquitetura por Camadas

### 1. Camada de Aplicação (Apps)

#### Aplicações NestJS
- **Responsabilidade**: Backend for Frontend, APIs REST
- **Tecnologia**: NestJS, TypeScript
- **Padrões**: Controllers, Services, Modules
- **Endpoints**: APIs RESTful, health checks, monitoring

#### Serviços Go
- **Responsabilidade**: Serviços especializados de alta performance
- **Tecnologia**: Go, frameworks web (Echo, Gin, Fiber)
- **Padrões**: Handlers, Services, Middleware
- **Endpoints**: APIs RESTful, gRPC, health checks

#### Aplicações Express
- **Responsabilidade**: Serviços simples e microserviços
- **Tecnologia**: Express.js, TypeScript
- **Padrões**: Routes, Middleware, Controllers
- **Endpoints**: APIs RESTful, webhooks

### 2. Camada de Domínio (Libraries)

#### Bibliotecas de Domínio TypeScript
- **Responsabilidade**: Lógica de negócio (TypeScript)
- **Padrões**: Repository Pattern, Domain Events, Entities
- **Componentes**:
  - Entities (Domain Models)
  - Domain Services
  - Repository Interfaces
  - Domain Events
  - DTOs e Value Objects

#### Bibliotecas de Domínio Go
- **Responsabilidade**: Lógica de negócio (Go)
- **Padrões**: Repository Pattern, Domain Events, Structs
- **Componentes**:
  - Structs (Domain Models)
  - Domain Services
  - Repository Interfaces
  - Domain Events
  - Data Types e Value Objects

### 3. Camada de Infraestrutura (Libraries)

#### Bibliotecas de Infraestrutura
- **Responsabilidade**: Implementações técnicas
- **Features**: Database access, external APIs, logging, monitoring
- **Integração**: NestJS, Express, Go services

## Padrões Arquiteturais

### 1. Clean Architecture

```
┌─────────────────────────────────────┐
│           Presentation              │
│  (Controllers, Handlers, Routes)   │
├─────────────────────────────────────┤
│           Application               │
│        (Use Cases, Services)       │
├─────────────────────────────────────┤
│            Domain                   │
│    (Entities, Business Logic)     │
├─────────────────────────────────────┤
│         Infrastructure         │
│    (Repositories, External APIs)   │
└─────────────────────────────────────┘
```

### 2. Domain-Driven Design (DDD)

#### Bounded Contexts
- **User Management**: Gerenciamento de usuários
- **Logging**: Sistema de logs
- **Health Monitoring**: Monitoramento de saúde

#### Aggregates
- **User Aggregate**: User entity + UserService + UserRepository

### 3. Repository Pattern

```typescript
// TypeScript Interface
interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
```

```go
// Go Interface
type UserRepository interface {
    Create(ctx context.Context, data CreateUserData) (*User, error)
    FindByID(ctx context.Context, id string) (*User, error)
    FindAll(ctx context.Context) ([]*User, error)
    Update(ctx context.Context, id string, data UpdateUserData) (*User, error)
    Delete(ctx context.Context, id string) error
}
```

### 4. Event-Driven Architecture

#### Domain Events
```typescript
interface UserEvents {
  onUserCreated(user: User): void;
  onUserUpdated(user: User): void;
  onUserDeleted(userId: string): void;
}
```

## Fluxo de Dados e Execução

O workspace implementa pipelines de execução otimizados para diferentes cenários de uso.

> **📋 Para detalhes completos sobre pipelines, dependências e execução, consulte [Pipeline de Tasks](TASK_PIPELINE.md)**

### Resumo dos Fluxos
- **BFF NestJS**: Client → Controller → Service → Library → Repository
- **Go Service**: Client → Handler → Service → Library → Repository
- **Logging**: Structured logging com correlation IDs em todos os fluxos

## Decisões Arquiteturais (ADRs)

### ADR-001: Monorepo com Nx
**Decisão**: Usar Nx para gerenciar o monorepo
**Justificativa**: 
- Compartilhamento de código entre projetos
- Cache inteligente para builds e testes
- Gerenciamento de dependências simplificado
- CI/CD otimizado

### ADR-002: Híbrido TypeScript/Go
**Decisão**: Usar TypeScript para aplicações web e Go para serviços especializados
**Justificativa**:
- TypeScript: Ecossistema rico, desenvolvimento rápido, tipagem estática
- Go: Performance, concorrência nativa, deploy simples, baixo uso de memória

### ADR-003: Repository Pattern
**Decisão**: Implementar Repository Pattern para abstração de dados
**Justificativa**:
- Testabilidade (mocks fáceis)
- Flexibilidade (troca de implementações)
- Separação de responsabilidades
- Independência de tecnologia de persistência

### ADR-004: Sistema de Tags Multidimensionais
**Decisão**: Implementar sistema de tags para controle de dependências
**Justificativa**:
- Controle automático de dependências
- Arquitetura limpa
- Isolamento de runtime
- Visibilidade de projetos

## Qualidade e Testes

### Estratégia de Testes

```
┌─────────────────────────────────────┐
│           E2E Tests                │
│    (Full Application Flow)         │
├─────────────────────────────────────┤
│        Integration Tests           │
│    (Component Integration)        │
├─────────────────────────────────────┤
│          Unit Tests                │
│      (Individual Components)       │
└─────────────────────────────────────┘
```

### Cobertura de Testes
- **Libraries**: ≥ 85% (Go), ≥ 90% (TypeScript)
- **Applications**: ≥ 70%
- **Integration**: ≥ 70%

### Ferramentas de Qualidade
- **Linting**: ESLint (TS), golangci-lint (Go)
- **Formatting**: Biome (TS), gofmt (Go)
- **Type Checking**: TypeScript, Go compiler
- **Testing**: Jest (TS), Go testing package

## Monitoramento e Observabilidade

### Logging Estruturado
- **Correlation IDs**: Rastreamento de requisições
- **Structured Logs**: JSON format
- **Log Levels**: Debug, Info, Warn, Error, Fatal
- **Redaction**: Dados sensíveis automaticamente removidos

### Health Checks
- **NestJS**: `/health`, `/monitoring`
- **Go Services**: `/health`, `/health/ready`, `/health/live`
- **Express**: `/health`, `/status`

### Métricas
- **Performance**: Response times, throughput
- **Errors**: Error rates, error types
- **Business**: Operations, system health

## Segurança

### Princípios
- **Least Privilege**: Mínimo de permissões necessárias
- **Defense in Depth**: Múltiplas camadas de segurança
- **Input Validation**: Validação rigorosa de entrada
- **Error Handling**: Não exposição de informações sensíveis

### Implementações
- **CORS**: Configurável por ambiente
- **Request Timeout**: 30 segundos
- **Input Validation**: class-validator (TS), custom validation (Go)
- **Log Redaction**: Dados sensíveis removidos automaticamente

## Performance

### Otimizações
- **Nx Cache**: Build e test caching
- **Go Concurrency**: Goroutines para operações paralelas
- **Memory Management**: Garbage collection otimizado
- **Database**: Connection pooling (quando aplicável)

### Benchmarks Esperados
- **Go Services**: ~10k requests/second
- **NestJS**: ~5k requests/second
- **Express**: ~3k requests/second
- **Memory Usage**: < 100MB por serviço

## Escalabilidade

### Estratégias
- **Horizontal Scaling**: Múltiplas instâncias
- **Load Balancing**: Distribuição de carga
- **Caching**: Redis para cache distribuído
- **Database**: Sharding por contexto de domínio

### Limitações do Template
- **Sem Database**: Implementação de persistência fica a cargo do projeto
- **Sem Clustering**: Configuração de clustering específica do projeto
- **Sem Message Queues**: Implementação de messaging específica do projeto

## Roadmap Técnico

### Fase 1: Infraestrutura Base ✅
- [x] Quality gates
- [x] Module boundaries
- [x] Sistema de tags

### Fase 2: Padrões Arquiteturais ✅
- [x] Clean Architecture
- [x] Repository Pattern
- [x] Domain-Driven Design

### Fase 3: Ferramentas e Automação ✅
- [x] Biome (linting/formatação)
- [x] Jest (testes)
- [x] ESLint (regras específicas)
- [x] Pipeline de CI/CD

### Fase 4: Extensões Futuras
- [ ] Database integration (PostgreSQL, MongoDB)
- [ ] Redis caching
- [ ] Distributed tracing
- [ ] Metrics collection (Prometheus)
- [ ] Authentication/Authorization
- [ ] API Gateway
- [ ] Message queues (RabbitMQ, Kafka)
- [ ] Event sourcing
- [ ] CQRS pattern

## Conclusão

A arquitetura do template foi projetada para ser:

- **Escalável**: Suporte a crescimento horizontal e vertical
- **Manutenível**: Código limpo, bem testado e documentado
- **Flexível**: Fácil adição de novos serviços e funcionalidades
- **Performante**: Otimizada para alta performance
- **Observável**: Logs, métricas e health checks integrados
- **Reutilizável**: Template genérico para novos projetos

A combinação de TypeScript/Node.js e Go permite aproveitar o melhor de cada ecossistema, enquanto o Nx garante a eficiência do desenvolvimento em monorepo.
