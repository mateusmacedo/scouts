# @scouts/user-go

SDK Go para gerenciamento de usuários que compartilha contratos com `@scouts/user-node` e oferece serviços com validação, repositório e publicação de eventos.

> ℹ️ O pacote ainda exporta apenas a função `GoUser` como verificação básica. Use este guia para evoluir o módulo mantendo compatibilidade com o serviço `user-go-service`.

## Requisitos mínimos

| Ferramenta  | Versão |
|-------------|--------|
| Go          | 1.23   |
| Task runner | `pnpm` para executar alvos Nx |
| Linter      | `golangci-lint` opcional |

## Estrutura recomendada do módulo

```
libs/user-go/
├── go.mod
├── go-user.go                 # Stub atual
├── internal/
│   ├── domain/
│   │   └── user.go            # Structs e erros
│   ├── repository/
│   │   ├── repository.go      # Interfaces
│   │   └── memory.go          # Implementação em memória
│   ├── service/
│   │   └── service.go         # Casos de uso
│   └── events/
│       └── bus.go             # Canal de eventos
└── tests/
    └── service_test.go        # Cenários E2E de CRUD
```

## Entidades e DTOs em Go

```go
package domain

type UserStatus string

const (
    StatusActive   UserStatus = "active"
    StatusInactive UserStatus = "inactive"
    StatusBlocked  UserStatus = "blocked"
)

type User struct {
    ID        string            `json:"id"`
    Name      string            `json:"name"`
    Email     string            `json:"email"`
    Document  string            `json:"document,omitempty"`
    Status    UserStatus        `json:"status"`
    Metadata  map[string]any    `json:"metadata,omitempty"`
    CreatedAt time.Time         `json:"createdAt"`
    UpdatedAt time.Time         `json:"updatedAt"`
    DeletedAt *time.Time        `json:"deletedAt,omitempty"`
}

type CreateUserInput struct {
    Name     string `json:"name" validate:"required,max=120"`
    Email    string `json:"email" validate:"required,email"`
    Document string `json:"document" validate:"omitempty,len=11|len=14"`
}

type UpdateUserInput struct {
    Name     *string     `json:"name" validate:"omitempty,max=120"`
    Email    *string     `json:"email" validate:"omitempty,email"`
    Status   *UserStatus `json:"status" validate:"omitempty,oneof=active inactive blocked"`
    Metadata map[string]any `json:"metadata"`
}

type ListUsersInput struct {
    Page   int         `validate:"gte=1"`
    Limit  int         `validate:"gt=0,lte=100"`
    Status UserStatus  `validate:"omitempty,oneof=active inactive blocked"`
    Search string      `validate:"omitempty,min=3"`
}
```

## Repositório

```go
package repository

type UserRepository interface {
    Create(ctx context.Context, input domain.CreateUserInput) (domain.User, error)
    FindByID(ctx context.Context, id string) (domain.User, error)
    FindByEmail(ctx context.Context, email string) (domain.User, error)
    Update(ctx context.Context, id string, input domain.UpdateUserInput) (domain.User, error)
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, input domain.ListUsersInput) ([]domain.User, int, error)
}
```

Implementação de referência (`memory.go`):

- Usa `sync.RWMutex` para concorrência segura.
- Gera IDs com `github.com/oklog/ulid/v2`.
- Persiste entidades em `map[string]domain.User`.
- Retorna erros sentinela `domain.ErrDuplicatedEmail` e `domain.ErrNotFound` para facilitar `errors.Is`.

## Serviço e validações

```go
package service

import (
    "context"
    "fmt"

    "github.com/go-playground/validator/v10"
)

type Service struct {
    repo   repository.UserRepository
    bus    events.Bus
    validate *validator.Validate
}

func New(repo repository.UserRepository, bus events.Bus) *Service {
    v := validator.New()
    return &Service{repo: repo, bus: bus, validate: v}
}

func (s *Service) Create(ctx context.Context, input domain.CreateUserInput) (domain.User, error) {
    if err := s.validate.Struct(input); err != nil {
        return domain.User{}, fmt.Errorf("validation error: %w", err)
    }
    if existing, _ := s.repo.FindByEmail(ctx, input.Email); existing.ID != "" {
        return domain.User{}, domain.ErrDuplicatedEmail
    }
    user, err := s.repo.Create(ctx, input)
    if err != nil {
        return domain.User{}, err
    }
    s.bus.Publish(events.UserCreated{User: user})
    return user, nil
}

func (s *Service) Update(ctx context.Context, id string, input domain.UpdateUserInput) (domain.User, error) {
    if err := s.validate.Struct(input); err != nil {
        return domain.User{}, fmt.Errorf("validation error: %w", err)
    }
    user, err := s.repo.Update(ctx, id, input)
    if err != nil {
        return domain.User{}, err
    }
    s.bus.Publish(events.UserUpdated{User: user})
    return user, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
    if err := s.repo.Delete(ctx, id); err != nil {
        return err
    }
    s.bus.Publish(events.UserDeleted{ID: id})
    return nil
}
```

## Eventos

```go
package events

type Bus interface {
    Publish(evt any)
    Subscribe(topic string) <-chan any
    Close()
}

const TopicUser = "user"

type UserCreated struct { User domain.User }
type UserUpdated struct { User domain.User }
type UserDeleted struct { ID string }
```

Implementação mínima: canal buffered com fan-out (`chan any` + goroutines) e encerramento gracioso usando `context.Context`.

## Exemplo completo (CRUD + eventos)

```go
package main

import (
    "context"
    "log"
    "time"

    "github.com/mateusmacedo/scouts/libs/user-go/internal/domain"
    "github.com/mateusmacedo/scouts/libs/user-go/internal/events"
    "github.com/mateusmacedo/scouts/libs/user-go/internal/repository"
    "github.com/mateusmacedo/scouts/libs/user-go/internal/service"
)

func main() {
    ctx := context.Background()
    repo := repository.NewMemory()
    bus := events.NewInMemoryBus()
    svc := service.New(repo, bus)

    sub := bus.Subscribe(events.TopicUser)
    go func() {
        for evt := range sub {
            log.Printf("received event %#v", evt)
        }
    }()

    created, err := svc.Create(ctx, domain.CreateUserInput{
        Name:  "João Silva",
        Email: "joao@example.com",
    })
    if err != nil {
        log.Fatal(err)
    }

    _, _ = svc.Update(ctx, created.ID, domain.UpdateUserInput{Status: domain.StatusInactive})

    list, total, _ := svc.List(ctx, domain.ListUsersInput{Page: 1, Limit: 10})
    log.Printf("users: %d total: %d", len(list), total)

    _ = svc.Delete(ctx, created.ID)

    time.Sleep(100 * time.Millisecond)
    bus.Close()
}
```

## Execução e testes

```bash
# Rodar testes unitários
pnpm nx test user-go

# Go direto
cd libs/user-go
go test ./...

# Lint (opcional, recomenda-se golangci-lint)
golangci-lint run ./...
```

## Documentação relacionada

- [Arquitetura do domínio de usuários](../../docs/architecture/user-platform.md)
- Integração HTTP: consulte `apps/user-go-service/README.md`.

