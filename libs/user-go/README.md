# user-go

Biblioteca Go para gerenciamento básico de usuários com funcionalidades essenciais.

## Características

- **Simplicidade**: Interface Go idiomática e direta
- **Performance**: Implementação otimizada para alta performance
- **Concorrência**: Suporte nativo à concorrência Go
- **Testável**: Cobertura de testes com Go testing package
- **Modular**: Arquitetura modular para fácil extensão

## Instalação

```bash
go get github.com/mateusmacedo/scouts/libs/user-go
```

## Uso Básico

```go
package main

import (
    "fmt"
    gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
    result := gouser.GoUser("João Silva")
    fmt.Println(result) // "GoUser João Silva"
}
```

## API Reference

### GoUser(name string) string

Cria uma string de identificação de usuário com o nome fornecido.

**Parâmetros:**
- `name` (string): Nome do usuário

**Retorno:** `string` - String formatada "GoUser {name}"

**Exemplo:**
```go
package main

import (
    "fmt"
    gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
    user := gouser.GoUser("Maria Santos")
    fmt.Println(user) // "GoUser Maria Santos"
}
```

## Arquitetura

A biblioteca `user-go` segue as convenções Go padrão:

```
libs/user-go/
├── user-go.go        # Implementação principal
├── user-go_test.go   # Testes unitários
├── go.mod           # Dependências Go
└── project.json     # Configuração Nx
```

### Estrutura do Código

```go
package gouser

// GoUser cria uma identificação de usuário
func GoUser(name string) string {
    result := "GoUser " + name
    return result
}
```

## Desenvolvimento

### Build

```bash
# Build da biblioteca
pnpm nx build user-go

# Build com watch mode
pnpm nx build user-go --watch
```

### Testes

```bash
# Executar testes
pnpm nx test user-go

# Testes com coverage
pnpm nx test user-go --coverage

# Testes em watch mode
pnpm nx test user-go --watch
```

### Lint e Formatação

```bash
# Lint
pnpm nx lint user-go

# Formatação
pnpm nx format user-go

# Biome (linting + formatação)
pnpm nx biome user-go
```

## Versionamento

A biblioteca utiliza versionamento semântico via git tags:

```bash
# Verificar versão atual
git tag -l | grep user-go

# Criar nova versão
git tag user-go@v1.0.0
git push origin user-go@v1.0.0
```

### Module Path

O module path é configurado para GitHub:

```go
module github.com/mateusmacedo/scouts/libs/user-go
```

### Uso com Versões Específicas

```go
// Usar versão específica
go get github.com/mateusmacedo/scouts/libs/user-go@v1.0.0

// Usar versão mais recente
go get github.com/mateusmacedo/scouts/libs/user-go@latest
```

## Roadmap

### Funcionalidades Planejadas

- [ ] **User Struct**: Estrutura para representação de usuários
- [ ] **User Service**: Serviço para operações CRUD de usuários
- [ ] **User Validation**: Validação de dados de usuário
- [ ] **User Events**: Sistema de eventos para mudanças de usuário
- [ ] **User Repository**: Interface para persistência de usuários
- [ ] **Concurrency**: Suporte a operações concorrentes
- [ ] **Context**: Suporte a context.Context para cancelamento

### Exemplo de Uso Futuro

```go
// Funcionalidade planejada
package main

import (
    "context"
    "fmt"
    gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
    ctx := context.Background()
    
    // Criar usuário
    user, err := gouser.CreateUser(ctx, gouser.CreateUserRequest{
        Name:  "João Silva",
        Email: "joao@example.com",
    })
    if err != nil {
        panic(err)
    }
    
    // Buscar usuário
    foundUser, err := gouser.FindUser(ctx, user.ID)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("User: %+v\n", foundUser)
}
```


## Testes

### Executar Testes

```bash
# Testes unitários
go test ./libs/user-go

# Testes com coverage
go test -cover ./libs/user-go

# Testes com coverage detalhado
go test -coverprofile=coverage.out ./libs/user-go
go tool cover -html=coverage.out
```

### Exemplo de Teste

```go
package gouser

import "testing"

func TestGoUser(t *testing.T) {
    tests := []struct {
        name     string
        input    string
        expected string
    }{
        {
            name:     "valid name",
            input:    "João Silva",
            expected: "GoUser João Silva",
        },
        {
            name:     "empty name",
            input:    "",
            expected: "GoUser ",
        },
        {
            name:     "special characters",
            input:    "João-Silva_123",
            expected: "GoUser João-Silva_123",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := GoUser(tt.input)
            if result != tt.expected {
                t.Errorf("GoUser(%q) = %q, want %q", tt.input, result, tt.expected)
            }
        })
    }
}
```

## Performance

### Benchmarks

```go
// benchmark_test.go
package gouser

import "testing"

func BenchmarkGoUser(b *testing.B) {
    for i := 0; i < b.N; i++ {
        GoUser("Test User")
    }
}

func BenchmarkGoUserLongName(b *testing.B) {
    longName := "Very Long User Name That Exceeds Normal Length"
    for i := 0; i < b.N; i++ {
        GoUser(longName)
    }
}
```

### Executar Benchmarks

```bash
# Benchmarks
go test -bench=. ./libs/user-go

# Benchmarks com profiling
go test -bench=. -cpuprofile=cpu.prof ./libs/user-go
go tool pprof cpu.prof
```

## Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Código

- Siga as convenções Go padrão
- Use `gofmt` para formatação
- Use `golint` para verificação de estilo
- Escreva testes para todas as funcionalidades
- Documente funções públicas com comentários Go

## Licença

MIT - veja o arquivo [LICENSE](../../LICENSE) para detalhes.

