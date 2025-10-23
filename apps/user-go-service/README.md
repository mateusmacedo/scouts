# user-go-service

Serviço HTTP escrito em Go que orquestra o domínio de usuários através da biblioteca `@scouts/user-go`. O objetivo é expor uma API REST consistente para operações CRUD e emissão de eventos de domínio.

> ℹ️ O código atual possui apenas um `main.go` mínimo que imprime o retorno do SDK. Utilize este guia para estruturar o serviço HTTP antes de publicar novas versões.

## Requisitos mínimos

| Dependência        | Versão | Observações                              |
|--------------------|--------|-------------------------------------------|
| Go                 | 1.23   | Necessário para build e testes            |
| Node.js / pnpm     | ≥18 / ≥8 | Execução dos comandos Nx                  |
| Docker (opcional)  | 24+    | Provisionar dependências locais (Postgres)|

## Configuração de ambiente

Crie um arquivo `.env` na raiz do projeto ou configure variáveis antes da execução:

| Variável              | Descrição                                               | Default |
|-----------------------|---------------------------------------------------------|---------|
| `PORT`                | Porta HTTP exposta pelo serviço                         | `8080`  |
| `USER_DB_DSN`         | DSN de conexão com o repositório de usuários            | —       |
| `USER_EVENTS_TOPIC`   | Tópico ou fila para encaminhar eventos de domínio       | `user.events` |
| `LOG_LEVEL`           | Nível de log (`debug`, `info`, `warn`, `error`)         | `info`  |
| `REQUEST_TIMEOUT_MS`  | Timeout padrão das requisições recebidas                | `5000`  |
| `ALLOW_ORIGINS`       | Lista separada por vírgula para CORS                    | `*`     |

Carregar as variáveis (exemplo):

```bash
export PORT=8080
export USER_DB_DSN="postgres://postgres:postgres@localhost:5432/users?sslmode=disable"
export USER_EVENTS_TOPIC="users-domain"
```

## Fluxo de desenvolvimento

1. **Instalar dependências**
   ```bash
   pnpm install
   ```
2. **Executar o serviço em modo desenvolvimento**
   ```bash
   pnpm nx serve user-go-service -- --env-file=.env
   ```
   Recomenda-se mover o código HTTP para `cmd/http/main.go` e utilizar `air` ou `reflex` para *live reload*.
3. **Executar testes**
   ```bash
   pnpm nx test user-go-service
   ```
4. **Lint e formatação**
   ```bash
   golangci-lint run ./...
   gofmt -w .
   ```
5. **Build para distribuição**
   ```bash
   pnpm nx build user-go-service -- --outputPath=dist/apps/user-go-service
   ```

## Topologia HTTP

| Método | Rota              | Descrição                               | Handler sugerido                   |
|--------|-------------------|-----------------------------------------|------------------------------------|
| `GET`  | `/health/live`    | Verifica dependências essenciais        | `internal/http/health/live.go`     |
| `GET`  | `/health/ready`   | Verifica banco, mensageria e cache      | `internal/http/health/ready.go`    |
| `POST` | `/users`          | Cria usuário                            | `internal/http/users/create.go`    |
| `GET`  | `/users`          | Lista usuários com paginação            | `internal/http/users/list.go`      |
| `GET`  | `/users/{id}`     | Retorna usuário por ID                  | `internal/http/users/get.go`       |
| `PUT`  | `/users/{id}`     | Atualiza usuário                        | `internal/http/users/update.go`    |
| `DELETE` | `/users/{id}`   | Realiza remoção lógica                  | `internal/http/users/delete.go`    |

### Contratos HTTP

#### POST /users

Request:
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "document": "12345678901"
}
```

Response 201:
```json
{
  "id": "01HZPX1MB6W6V8KQ5XY1VB2K9C",
  "name": "João Silva",
  "email": "joao@example.com",
  "status": "active",
  "createdAt": "2024-04-08T12:01:02Z",
  "updatedAt": "2024-04-08T12:01:02Z"
}
```

Erros comuns:
- `409 Conflict` quando `email` já existe.
- `422 Unprocessable Entity` para falhas de validação.

#### GET /users

Query params: `page`, `limit`, `status`, `search`.

Response 200:
```json
{
  "items": [
    { "id": "01HZPX1MB6W6V8KQ5XY1VB2K9C", "name": "João Silva", "status": "active" }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

#### DELETE /users/{id}

- Deve retornar `204 No Content`.
- Publica evento `user.deleted` no `USER_EVENTS_TOPIC`.

## Eventos de domínio

Integre `@scouts/user-go` com a mensageria escolhida utilizando um adaptador simples:

```go
bus := events.NewInMemoryBus()
svc := service.New(repo, bus)

sub := bus.Subscribe(events.TopicUser)
go func() {
    for evt := range sub {
        switch payload := evt.(type) {
        case events.UserCreated:
            publisher.Publish("user.created", payload)
        case events.UserUpdated:
            publisher.Publish("user.updated", payload)
        case events.UserDeleted:
            publisher.Publish("user.deleted", payload)
        }
    }
}()
```

## Observabilidade

- **Logs estruturados**: utilize `slog` ou `zerolog` para incluir `request_id`, `user_id` e `correlation_id`.
- **Métricas**: exponha `/metrics` via Prometheus quando necessário.
- **Tracing**: reserve cabeçalhos `traceparent` e `tracestate` para integrações com OpenTelemetry.

## Estrutura de pastas sugerida

```
apps/user-go-service/
├── cmd/http/main.go          # Bootstrap HTTP
├── internal/config/          # Carregamento de variáveis de ambiente
├── internal/http/            # Handlers, middlewares, roteadores
├── internal/service/         # Facade para @scouts/user-go
├── internal/repository/      # Implementações concretas (Postgres, memory)
├── internal/log/             # Adapters de logging
└── pkg/                      # Utilitários compartilhados
```

## Documentação relacionada

- [Arquitetura do domínio de usuários](../../docs/architecture/user-platform.md)
- Contratos de domínio: consulte `libs/user-go/README.md` e `libs/user-node/README.md`.

