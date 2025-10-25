# GitHub Actions Workflows

Este diretório contém os workflows de CI/CD para o monorepo Nx com projetos Go e Node.js.

## Workflows Disponíveis

### 1. CI (`.github/workflows/ci.yml`)

**Triggers:**
- Push em qualquer branch
- Pull requests para qualquer branch

**Jobs:**
- `setup`: Configuração do ambiente (Node.js, Go, pnpm, Nx)
- `lint-node`: Lint de projetos Node.js/TypeScript
- `lint-go`: Validações Go (fmt, vet, lint)
- `test-node`: Testes Node.js com cobertura
- `test-go`: Testes Go com cobertura
- `build`: Build de todos os projetos afetados
- `coverage-report`: Consolidação de relatórios de cobertura

**Estratégia:**
- **Pull Requests**: Apenas projetos afetados (`nx affected`)
- **Push em main/develop**: Todos os projetos (`nx run-many --all`)

### 2. PR Validation (`.github/workflows/pr-validation.yml`)

**Triggers:**
- Pull requests (opened, synchronize, reopened)

**Validações:**
- Título segue Conventional Commits
- Branch segue convenção de nomenclatura
- Verificação de conflitos
- Controle de tamanho do PR
- Comentários automáticos no PR

### 3. Security Audit (`.github/workflows/security-audit.yml`)

**Triggers:**
- Agendado (diário, 3h UTC)
- Manual (`workflow_dispatch`)
- Push em main/develop

**Validações:**
- Auditoria de dependências Node.js
- Verificação de segredos hardcoded
- Verificação de licenças
- Validação de secrets obrigatórios

## Actions Reutilizáveis

### Setup Workspace (`.github/actions/setup-workspace/`)

Configura o ambiente de desenvolvimento:
- Node.js 18.x
- Go 1.23
- pnpm 9.15.0
- Instalação de dependências
- Configuração de cache

### Go Validation (`.github/actions/go-validation/`)

Validações para projetos Go:
- `go fmt` (formatação)
- `go vet` (análise estática)
- `go mod tidy` (dependências)
- Lint via Nx
- Sincronização de versões

### Node.js Validation (`.github/actions/node-validation/`)

Validações para projetos Node.js:
- ESLint
- Biome format check
- Testes com cobertura

## Configuração

### Secrets Necessários

Configurar em **Settings > Secrets and variables > Actions**:

- `GH_TOKEN`: Token GitHub (para releases/comentários)
- `NPM_TOKEN`: Token npm (para publicação futura)
- `SONAR_TOKEN`: Token SonarCloud (análise de qualidade - opcional)

### Cache

O workflow utiliza cache agressivo para:
- Dependências pnpm (`~/.pnpm-store`, `~/.pnpm-cache`)
- Cache do Nx (`.nx/cache`)
- Módulos Go (via `go.work`)

### Threshold de Cobertura

Configurado em `nx.json`:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Comandos Úteis

### Executar Localmente

```bash
# Lint todos os projetos
pnpm nx run-many -t lint --all

# Testes com cobertura
pnpm nx run-many -t test --all --coverage

# Build todos os projetos
pnpm nx run-many -t build --all

# Apenas projetos afetados
pnpm nx affected -t lint,test,build --base=origin/main
```

### Validações Go

```bash
# Formatação
go fmt -l ./apps/user-go-service ./libs/user-go

# Análise estática
go vet ./apps/user-go-service/... ./libs/user-go/...

# Dependências
cd apps/user-go-service && go mod tidy
cd libs/user-go && go mod tidy

# Sincronização de versões
./scripts/sync-go-versions.sh
```

### Validações Node.js

```bash
# ESLint
pnpm nx run-many -t lint --all

# Biome format
pnpm biome format --check .

# Testes
pnpm nx run-many -t test --all
```

## Troubleshooting

### Cache Miss

Se o cache não estiver funcionando:
1. Verificar se `pnpm-lock.yaml` está atualizado
2. Verificar se `go.work` e `go.sum` estão corretos
3. Limpar cache manualmente se necessário

### Falha de Dependências

Se houver falha na instalação de dependências:
1. Verificar se `pnpm-lock.yaml` está commitado
2. Verificar se todas as dependências estão no `package.json`
3. Executar `pnpm install` localmente

### Falha de Testes

Se os testes falharem:
1. Verificar se todos os arquivos de teste estão corretos
2. Verificar se a cobertura atinge o threshold (70%)
3. Executar testes localmente: `pnpm nx test <project-name>`

## Próximos Passos

- [ ] Integração com SonarCloud
- [ ] Deploy automático em staging
- [ ] Notificações Slack/Discord
- [ ] Análise de performance de build
- [ ] E2E tests em ambiente isolado
