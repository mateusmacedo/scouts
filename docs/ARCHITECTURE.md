# Arquitetura do Monorepo Scouts

## 1. Visão Geral (C4 - Contexto)
O monorepo concentra serviços e bibliotecas Node.js, NestJS e Go publicados de forma independente via Nx Release, com foco em logging estruturado, monitoração e domínio de usuários. Aplicações clientes consomem o BFF em NestJS, que orquestra bibliotecas internas e integrações futuras com serviços especializados (por exemplo, o serviço de usuários em Go).

### 1.1 Atores e sistemas externos
- **Aplicações Cliente** – Frontends ou integrações externas que consomem o BFF via HTTP.
- **Plataforma de Observabilidade** – Destino de métricas e logs estruturados exportados pelo logger.
- **Serviços de Domínio** – Microsserviços especializados (ex.: serviço de usuários em Go) que expõem APIs ou SDKs internos.

### 1.2 Diagrama de Contexto (C4)
```mermaid
graph LR
    ClientApps[Aplicações Cliente]
    Observability[(Stack de Observabilidade)]
    BFF[@scouts/bff-nest\nNestJS BFF]
    GoSvc[scouts/user-go-service\nServiço Go]
    Logger[@scouts/logger-node\nLogger Core]
    Utils[@scouts/utils-nest\nUtilitários Nest]
    NodeUser[@scouts/user-node\nSDK Node]
    GoUser[scouts/user-go\nSDK Go]

    ClientApps -->|REST/GraphQL| BFF
    BFF -->|SDK interno| NodeUser
    BFF -->|LoggerModule| Utils
    Utils -->|Composed Logger| Logger
    Logger -->|Logs & Métricas| Observability
    BFF -.->|Futuro REST/gRPC| GoSvc
    GoSvc -->|Reuso| GoUser
```

## 2. Limites de Contexto
- **Experiência Digital (BFF NestJS)** – Expõe APIs agregadas e aplica políticas transversais (correlation-id, redaction, métricas). Fonte: `apps/bff-nest/src`.
- **Plataforma de Observabilidade** – Composta por `@scouts/logger-node` e adapters NestJS. Fornece logging estruturado, coleta de métricas e redatores. Fontes: `libs/logger-node/src`, `libs/utils-nest/src/lib/logger`.
- **Domínio de Usuários** – SDKs reutilizáveis (`@scouts/user-node`, `scouts/user-go`) e o serviço Go `apps/user-go-service` para processamento especializado.
- **Qualidade e Tooling** – Biblioteca `@scouts/base-biome` com configuração compartilhada e automações Nx Release para versionamento/publish.

## 3. Contêineres e Componentes Principais (C4 Level 2/3)
| Contêiner / Componente | Tecnologia | Responsabilidades-chave |
| --- | --- | --- |
| `@scouts/bff-nest` (`AppModule`, `UsersModule`, `MonitoringModule`) | NestJS | Expor APIs REST, aplicar middleware de correlation-id, usar logger customizado e endpoint de health/monitoring. Fonte: `apps/bff-nest/src/app`.
| `@scouts/utils-nest` (`LoggerModule`, `HealthModule`, `SwaggerModule`) | NestJS libs | Adaptar `@scouts/logger-node` ao ecossistema NestJS, registrar health checks dinâmicos e middlewares de observabilidade. Fonte: `libs/utils-nest/src/lib`.
| `@scouts/logger-node` | Node.js | Biblioteca core de logging estruturado (composed logger, redator, métricas, middlewares). Fonte: `libs/logger-node/src`.
| `@scouts/user-node` | Node.js | SDK simples de domínio para uso em aplicações Node. Fonte: `libs/user-node/src/lib`.
| `scouts/user-go-service` | Go | Serviço de linha de comando / API futura reutilizando `scouts/user-go`. Fonte: `apps/user-go-service`.
| `scouts/user-go` | Go | Biblioteca de domínio compartilhada. Fonte: `libs/user-go`.
| `@scouts/base-biome` | Biome | Configuração base de lint/format para todo o workspace. Fonte: `libs/biome-base/biome.json`.

## 4. Dependências Nx e Regras de Boundaries
### 4.1 Mapa de dependências (apps ↔ libs)
| Projeto consumidor | Dependências diretas | Evidência |
| --- | --- | --- |
| `@scouts/bff-nest` | `@scouts/utils-nest`, `@scouts/logger-node`, `@scouts/user-node` | `main.ts`, `app.module.ts`, `app.service.ts` utilizam os módulos e decoradores. |
| `scouts/user-go-service` | `scouts/user-go` | `main.go` importa `github.com/mateusmacedo/scouts/libs/user-go`. |
| `@scouts/utils-nest` | `@scouts/logger-node` | `logger.module.ts` cria `createComposedLogger` e injeta `LOGGER_TOKEN`. |
| `@scouts/base-biome` | — (configuração) | `biome.json` raiz estende `libs/biome-base/biome.json`. |

### 4.2 Regras de boundaries
- Tags Nx: `type:app/lib`, `scope:internal`, `npm:public/private`, `go:public` – suportam governança por escopo. Fonte: `project.json` de cada projeto.
- Regra `@nx/enforce-module-boundaries` ativa com `enforceBuildableLibDependency` e sem restrições adicionais de tags (`*`), privilegiando liberdade com validação de libs buildáveis. Fonte: `eslint.config.mjs`.
- Caminhos TypeScript centralizados em `tsconfig.base.json`, garantindo resoluções explícitas para libs reutilizáveis.
- Workspaces Go sincronizados via `go.work` e alvo `sync-go-deps` para manter versões alinhadas. Fonte: `apps/user-go-service/project.json`.

## 5. Decisões Arquiteturais (ADRs resumidas)
1. **Monorepo Nx multi-runtime** – Nx 20.8.2 governa projetos Node, Nest e Go com release independente (`nx.json` e `package.json`).
2. **Stack de observabilidade proprietária** – `@scouts/logger-node` como fonte única de verdade com adapters Nest (`libs/utils-nest`) e middlewares de correlation-id.
3. **BFF como ponto de orquestração** – `@scouts/bff-nest` consome SDKs internos (`user-node`) e aplica políticas transversais antes de delegar a serviços especializados.
4. **Governança de qualidade via Biome** – Configuração base versionada em `@scouts/base-biome` e herdada por todo o workspace (`biome.json`).
5. **Release automatizado** – Estratégia Nx Release com versionamento convencional, publish seletivo e hooks de build/test no `nx.json`.

## 6. Monitoramento, Observabilidade e Próximos Passos (Fase 7)
### 6.1 Capacidades atuais
- **Logger customizado com métricas** (`NestLoggerService`, `MonitoringService.getLoggerMetrics`) – coleta contadores de logs e métricas de uso de memória.
- **Redação de dados sensíveis** – `LoggerModule` injeta redatores padrão (senha, token, cartão, SSN) e permite extensão.
- **Correlation ID** – Middleware aplicado globalmente em `AppModule.configure` garante rastreabilidade cross-request.
- **Health checks básicos** – `HealthModule.forRoot()` disponibiliza endpoint pronto para futuros indicadores customizados.

### 6.2 Próximos passos (Fase 7)
1. **Expor métricas Prometheus/OpenTelemetry** a partir do logger e health service, facilitando integração com observabilidade corporativa.
2. **Instrumentar o serviço Go** com correlation-id e export de métricas unificados, para completar a visão end-to-end.
3. **Criar dashboards e alertas** consumindo as métricas coletadas (latência, volume de logs, falhas).
4. **Formalizar contratos de integração** entre BFF e serviços especialistas (ex.: gRPC ou REST assíncrono) garantindo rastreabilidade.
5. **Automatizar testes de resiliência** (chaos/latência) utilizando os hooks do logger para validar alertas e circuit breakers.
