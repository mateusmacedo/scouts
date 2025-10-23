# Arquitetura do Domínio de Usuários

Este documento consolida as decisões arquiteturais para os componentes de gerenciamento de usuários distribuídos entre as bibliotecas `@scouts/user-node`, `@scouts/user-go` e o serviço `user-go-service`.

## Visão Geral

- **Camada de Domínio**: contratos puros de entidade, serviços e eventos, compartilhados entre implementações Node.js e Go.
- **Camada de Aplicação**: orquestração de casos de uso (CRUD, emissão de eventos) apoiada por validações e repositórios especializados.
- **Camada de Infraestrutura**: implementação concreta de persistência, transporte HTTP e adaptação de eventos para mensagerias ou filas.

```
apps/
└── user-go-service/         # Serviço HTTP em Go
libs/
├── user-node/               # SDK Node.js / TypeScript
└── user-go/                 # SDK Go
```

## Contratos Compartilhados

| Componente        | Responsabilidade principal                                  | Definição sugerida                        |
|-------------------|--------------------------------------------------------------|-------------------------------------------|
| `UserEntity`      | Modelo de domínio com metadados de auditoria                | Interface TS / struct Go                  |
| `UserRepository`  | Interface para persistência (CRUD + filtros paginados)      | Implementações específicas por tecnologia |
| `UserService`     | Casos de uso de usuário, incluindo validação e eventos      | Exposto por ambas as bibliotecas          |
| `DomainEventBus`  | Publicação e assinatura de eventos de domínio               | EventEmitter (Node) / canal (Go)          |
| `ValidationError` | Agregação de falhas de validação com códigos padronizados   | Custom Error (Node) / error wrapping (Go) |

## user-node

- Linguagem: TypeScript, alinhado com Node.js ≥ 18.
- Pastas sugeridas:
  - `src/lib/domain`: entidades e contratos de repositório.
  - `src/lib/dto`: DTOs de entrada/saída com `class-validator`.
  - `src/lib/services`: serviços de aplicação com orquestração.
  - `src/lib/events`: adaptadores para eventos e subscribers.
- EventEmitter dedicado (`NodeUserEventBus`) padroniza canais `user.created`, `user.updated`, `user.deleted`.

## user-go

- Linguagem: Go 1.23.
- Pastas sugeridas:
  - `internal/domain`: structs, erros e constantes.
  - `internal/repository`: implementações concretas (in-memory, SQL, etc.).
  - `internal/service`: regras de negócio e validações.
  - `internal/events`: canal buffered e publicadores externos.
- Validações com `github.com/go-playground/validator/v10` e composição de erros.

## user-go-service

- Serviço HTTP em Go que delega operações para `@scouts/user-go`.
- Estrutura recomendada:
  - `cmd/http`: inicialização, wiring de dependências e leitura de variáveis de ambiente.
  - `internal/http`: handlers, middlewares, serialização JSON e validação de payload.
  - `internal/config`: carga de configuração (`PORT`, `DATABASE_URL`, `USER_EVENTS_TOPIC`).
  - `internal/log`: integração com `zerolog` ou `slog`.
  - `internal/persistence`: repositórios concretos (PostgreSQL como referência).
- Endpoints REST previstos:
  - `GET    /health/live` e `GET /health/ready`.
  - `POST   /users` (criação), `GET /users/{id}` (consulta), `GET /users` (listagem paginada).
  - `PUT    /users/{id}` (atualização), `DELETE /users/{id}` (remoção lógica).
- Eventos de domínio publicados em canal Go e encaminhados para mensageria opcional.

## Próximos Passos

1. Padronizar DTOs e contratos compartilhados em ambos os SDKs.
2. Introduzir storage persistente (PostgreSQL) e camada de migrações.
3. Expandir documentação de observabilidade (logs estruturados, métricas, tracing).

