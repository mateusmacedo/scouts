# user-go-service

Serviço de usuários em Go que demonstra a integração com a biblioteca `scouts/user-go` e serve como exemplo de aplicação Go em um monorepo Nx.

## Características

- **Simplicidade**: Aplicação Go minimalista e direta
- **Integração**: Demonstra uso da biblioteca `user-go`
- **Nx Integration**: Totalmente integrado ao workspace Nx
- **Performance**: Aplicação Go otimizada para alta performance
- **Testável**: Cobertura de testes com Go testing package

## Arquitetura

```
apps/user-go-service/
├── main.go           # Ponto de entrada da aplicação
├── main_test.go      # Testes da aplicação
├── go.mod           # Dependências Go
├── go.sum           # Checksums das dependências
├── project.json     # Configuração Nx
└── package.json     # Metadados do projeto
```

### Estrutura do Código

```go
package main

import (
    "fmt"
    gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
    fmt.Println(gouser.GoUser("from user-go lib"))
}
```

## Execução

### Via Nx (Recomendado)

```bash
# Executar o serviço
pnpm nx serve user-go-service

# Build da aplicação
pnpm nx build user-go-service

# Testes
pnpm nx test user-go-service

# Lint
pnpm nx lint user-go-service

# Formatação
pnpm nx format user-go-service
```

### Via Go Direto

```bash
# Navegar para o diretório
cd apps/user-go-service

# Executar
go run main.go

# Build
go build -o user-go-service main.go

# Executar binário
./user-go-service

# Testes
go test ./...

# Testes com coverage
go test -cover ./...
```

## Desenvolvimento

### Configuração do Ambiente

```bash
# Instalar dependências
go mod tidy

# Verificar dependências
go mod verify

# Atualizar dependências
go mod download
```

### Sincronização de Dependências

O serviço utiliza a biblioteca `user-go` que é sincronizada automaticamente:

```bash
# Sincronizar dependências Go
pnpm nx run scouts/user-go-service:sync-go-deps

# Ou executar script diretamente
./scripts/sync-go-versions.sh
```

### Estrutura de Dependências

```go
// go.mod
module github.com/mateusmacedo/scouts/apps/user-go-service

go 1.23

require (
    github.com/mateusmacedo/scouts/libs/user-go v0.1.0
)
```

## Testes

### Executar Testes

```bash
# Testes via Nx
pnpm nx test user-go-service

# Testes via Go
go test ./apps/user-go-service

# Testes com coverage
go test -cover ./apps/user-go-service

# Testes com coverage detalhado
go test -coverprofile=coverage.out ./apps/user-go-service
go tool cover -html=coverage.out
```

### Exemplo de Teste

```go
// main_test.go
package main

import (
    "testing"
    "strings"
)

func TestMain(t *testing.T) {
    // Teste básico da função main
    // Nota: Em um cenário real, você testaria as funções individualmente
    // ao invés de testar main() diretamente
    t.Run("main function exists", func(t *testing.T) {
        // Verificar se a função main existe e pode ser chamada
        // (Este é um exemplo simplificado)
        if main == nil {
            t.Error("main function should exist")
        }
    })
}
```

## Integração com Workspace

### Dependências Nx

O projeto está configurado no `project.json`:

```json
{
  "name": "scouts/user-go-service",
  "sourceRoot": "apps/user-go-service",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx-go/nx-go:build",
      "outputs": ["{options.outputPath}"]
    },
    "serve": {
      "executor": "@nx-go/nx-go:serve"
    },
    "test": {
      "executor": "@nx-go/nx-go:test"
    },
    "sync-go-deps": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./scripts/sync-go-versions.sh"
      }
    }
  }
}
```

### Comandos Disponíveis

```bash
# Build
pnpm nx build user-go-service

# Serve (execução)
pnpm nx serve user-go-service

# Test
pnpm nx test user-go-service

# Lint
pnpm nx lint user-go-service

# Format
pnpm nx format user-go-service

# Sync Go Dependencies
pnpm nx run scouts/user-go-service:sync-go-deps
```

## CI/CD

### GitHub Actions

O serviço é testado automaticamente no CI:

```yaml
# .github/workflows/ci.yml
- name: Setup Go
  uses: actions/setup-go@v5
  with:
    go-version: '1.23'
    cache-dependency-path: |
      apps/user-go-service/go.sum
      libs/user-go/go.sum

- name: Run tests
  run: pnpm nx affected -t test
```

### Cache de Dependências

```yaml
# Cache automático do Go modules
- name: Setup Go
  uses: actions/setup-go@v5
  with:
    cache-dependency-path: |
      apps/user-go-service/go.sum
      libs/user-go/go.sum
```

## Roadmap

### Funcionalidades Planejadas

- [ ] **HTTP Server**: Servidor HTTP para APIs REST
- [ ] **User Endpoints**: Endpoints CRUD para usuários
- [ ] **Database Integration**: Integração com banco de dados
- [ ] **Logging**: Sistema de logging estruturado
- [ ] **Health Checks**: Endpoints de health check
- [ ] **Metrics**: Coleta de métricas de performance
- [ ] **Configuration**: Sistema de configuração via variáveis de ambiente

### Exemplo de Evolução Futura

```go
// main.go (versão futura)
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    
    gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        result := gouser.GoUser("HTTP User")
        fmt.Fprintf(w, "Hello from Go User Service: %s\n", result)
    })
    
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprint(w, "OK")
    })
    
    log.Printf("Server starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, nil))
}
```


## Performance

### Benchmarks

```go
// benchmark_test.go
package main

import (
    "testing"
    gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func BenchmarkGoUserService(b *testing.B) {
    for i := 0; i < b.N; i++ {
        gouser.GoUser("Benchmark User")
    }
}
```

### Executar Benchmarks

```bash
# Benchmarks
go test -bench=. ./apps/user-go-service

# Benchmarks com profiling
go test -bench=. -cpuprofile=cpu.prof ./apps/user-go-service
go tool pprof cpu.prof
```

## Troubleshooting

### Problemas Comuns

#### 1. Dependências Go Desatualizadas

```bash
# Sincronizar dependências
pnpm nx run scouts/user-go-service:sync-go-deps

# Verificar versão da lib
go list -m github.com/mateusmacedo/scouts/libs/user-go
```

#### 2. Erro de Module Path

```bash
# Verificar go.mod
cat apps/user-go-service/go.mod

# Atualizar dependências
go mod tidy
```

#### 3. Cache Nx

```bash
# Limpar cache
pnpm nx reset

# Rebuild
pnpm nx build user-go-service --skip-nx-cache
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

