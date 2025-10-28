# GitHub Actions Workflows

Este diretório contém workflows de CI/CD otimizados para Nx 20, seguindo padrões oficiais.

## Workflows Disponíveis

### 1. CI Optimized (`.github/workflows/ci-optimized.yml`)

**Triggers:**
- Push em qualquer branch
- Pull requests para qualquer branch

**Jobs (usando padrões Nx 20):**
- `setup`: Setup e detecção de mudanças usando `nx affected`
- `lint`: Lint de todos os projetos usando `nx affected`
- `test`: Testes com cobertura usando `nx affected`
- `build`: Build de projetos afetados usando `nx affected`
- `summary`: Resumo usando padrões Nx 20

**Estratégia:**
- **Todos os jobs**: Usam `nx affected` para detecção inteligente
- **Cache nativo**: Aproveita cache automático do Nx
- **Padrões oficiais**: Segue documentação oficial do Nx 20

### 2. PR Validation (`.github/workflows/pr-validation.yml`)

**Triggers:**
- Pull requests (opened, synchronize, reopened)

**Validações:**
- Título segue Conventional Commits
- Branch segue convenção de nomenclatura
- Verificação de conflitos
- Controle de tamanho do PR
- Comentários automáticos no PR


## Actions Reutilizáveis (Nx 20 Compliant)

### Setup Workspace (`.github/actions/setup-workspace/`)

Configura o ambiente seguindo padrões Nx 20:
- Node.js 18.x
- Go 1.23
- pnpm 9.15.0
- Instalação de dependências
- Cache nativo do Nx

### Go Validation (`.github/actions/go-validation/`)

Validações específicas para Go (não duplicam Nx):
- `go fmt` (formatação)
- `go vet` (análise estática)
- `go mod tidy` (dependências)
- Lint via Nx (`nx affected`)
- Sincronização de versões

### Node.js Validation (`.github/actions/node-validation/`)

Validações específicas para Node.js (não duplicam Nx):
- ESLint via Nx (`nx affected`)
- Biome check via Nx (`nx affected --target=biome-check`)
- Testes com cobertura via Nx (`nx affected`)

## Configuração

### Secrets Necessários

Configurar em **Settings > Secrets and variables > Actions**:

- `GH_TOKEN`: Token GitHub (para releases/comentários)
- `NPM_TOKEN`: Token npm (para publicação futura - opcional)

### Cache (Nx 20 Native)

O workflow utiliza cache nativo do Nx 20:
- **Cache automático**: Nx gerencia cache automaticamente
- **Dependências**: Cache via `nx.json` configuration
- **Build artifacts**: Cache via `nx.json` configuration
- **Test results**: Cache via `nx.json` configuration

### Configuração Nx 20

Configurado em `nx.json` com padrões oficiais:
- **targetDefaults**: Configuração de targets
- **namedInputs**: Inputs nomeados
- **cache**: Configuração de cache
- **coverage**: Thresholds de cobertura

## Comandos Úteis

### Biome Check (Nx 20 Compliant)

```bash
# Biome check em projetos afetados (recomendado)
pnpm nx affected --target=biome-check

# Biome check em todos os projetos TypeScript
pnpm nx run-many --target=biome-check

# Biome check em projeto específico
pnpm nx run @scouts/logger-node:biome-check
pnpm nx run @scouts/utils-nest:biome-check
pnpm nx run @scouts/user-node:biome-check
pnpm nx run bff-nest:biome-check
pnpm nx run @scouts/biome-base:biome-check
pnpm nx run notifier-express:biome-check
```

### Executar Localmente (Nx 20 Patterns)

```bash
# Lint projetos afetados (recomendado)
pnpm nx affected --target=lint

# Testes com cobertura (projetos afetados)
pnpm nx affected --target=test --coverage

# Build projetos afetados (recomendado)
pnpm nx affected --target=build

# Todos os projetos (quando necessário)
pnpm nx run-many --target=lint,test,build --all

# Análise de dependências
pnpm nx graph
```

### Validações Go (Nx 20 Compliant)

```bash
# Formatação
go fmt -l ./apps/user-go-service ./libs/user-go

# Análise estática
go vet ./apps/user-go-service/... ./libs/user-go/...

# Dependências
cd apps/user-go-service && go mod tidy
cd libs/user-go && go mod tidy

# Lint via Nx (recomendado)
pnpm nx affected --target=lint
```

### Validações Node.js (Nx 20 Compliant)

```bash
# ESLint via Nx (recomendado)
pnpm nx affected --target=lint

# Biome check via Nx (recomendado)
pnpm nx affected --target=biome-check

# Testes via Nx (recomendado)
pnpm nx affected --target=test --coverage
```

## Troubleshooting (Nx 20)

### Cache Issues

Se o cache não estiver funcionando:
1. Verificar configuração em `nx.json`
2. Executar `pnpm nx reset` para limpar cache
3. Verificar `nx.json` targetDefaults

### Dependências

Se houver falha na instalação:
1. Verificar `pnpm-lock.yaml` está commitado
2. Executar `pnpm install` localmente
3. Verificar configuração em `nx.json`

### Testes

Se os testes falharem:
1. Executar `pnpm nx affected --target=test --base=origin/main`
2. Verificar configuração de cobertura em `nx.json`
3. Usar `pnpm nx graph` para análise de dependências

## Benefícios Nx 20

- **Cache inteligente**: Automático e eficiente
- **Detecção de mudanças**: `nx affected` nativo
- **Paralelização**: Automática e otimizada
- **Configuração centralizada**: `nx.json`
- **Padrões oficiais**: Documentação e suporte
