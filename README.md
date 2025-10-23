# scouts

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

Monorepo Nx para desenvolvimento de aplicações e bibliotecas com suporte a TypeScript, Go e NestJS.

## 🏗️ Estrutura do Workspace

### Aplicações
- **`apps/bff-nest`** - Backend for Frontend em NestJS
- **`apps/user-go-service`** - Serviço de usuários em Go

### Bibliotecas
- **`libs/logger-node`** - Sistema de logging modular com padrão Proxy, correlation IDs, redação de dados sensíveis e métricas - `npm:public`
- **`libs/utils-nest`** - Utilitários para NestJS (health checks, swagger, logger adapter para logger-node) - `npm:public`
- **`libs/user-node`** - Biblioteca de usuários para Node.js - `npm:public`
- **`libs/user-go`** - Biblioteca de usuários para Go - `go:public`
- **`libs/base-biome`** - Configuração base do Biome - `npm:private`

### Sistema de Tags
Os projetos utilizam tags para categorização e controle de publicação:
- **`npm:public`** - Publicado no npm registry (npmjs.org)
- **`npm:private`** - Não publicado, uso interno
- **`go:public`** - Biblioteca Go versionada via git tags
- **`type:lib`** - Biblioteca
- **`type:app`** - Aplicação
- **`scope:internal`** - Escopo interno do workspace

## 🔧 Arquitetura de Logging

O workspace implementa uma stack completa de logging estruturado:

- **`logger-node`**: Biblioteca base com padrão Proxy para composição modular
- **`utils-nest`**: Adapter NestJS que integra logger-node com decorators e middleware
- **`bff-nest`**: Aplicação de demonstração da integração completa

**Características principais:**
- Logging estruturado com correlation IDs
- Redação automática de dados sensíveis
- Métricas de performance e volume
- Integração nativa com NestJS
- Suporte a múltiplos sinks (console, pino, custom)

## 🚀 Comandos Básicos

### Executar Aplicações

```bash
# NestJS BFF
pnpm nx serve bff-nest

# Go User Service
pnpm nx serve user-go-service
```

### Build e Testes

```bash
# Build de todos os projetos afetados
pnpm nx affected -t build

# Testes de todos os projetos afetados
pnpm nx affected -t test

# Lint de todos os projetos afetados
pnpm nx affected -t lint

# Formatação de código com Biome
pnpm nx affected -t format

# Verificação de boundaries de módulos
pnpm nx affected -t check-boundaries
```

### Verificar Projetos

```bash
# Ver todos os projetos
pnpm nx show projects

# Ver detalhes de um projeto específico
pnpm nx show project bff-nest
```

## 📚 Documentação

### Guias de Desenvolvimento
- **[Geradores Nx](docs/NX_GENERATORS.md)** - Como criar novos projetos e usar geradores
- **[Processo de Release](docs/RELEASE_PROCESS.md)** - Como fazer releases dos projetos
- **[Arquitetura de Workflows](docs/WORKFLOWS_ARCHITECTURE.md)** - Arquitetura moderna de CI/CD
- **[Arquitetura de Domínios](docs/ARCHITECTURE.md)** - Tags e restrições de dependência entre projetos

### Criar Novos Projetos

```bash
# Aplicação NestJS
pnpm nx g @nx/nest:application nova-app

# Aplicação Go
pnpm nx g @nx-go/nx-go:application nova-go-app

# Biblioteca TypeScript
pnpm nx g @nx/js:library nova-lib

# Biblioteca Go
pnpm nx g @nx-go/nx-go:library nova-go-lib
```

### Ver Geradores Disponíveis

```bash
# Listar todos os geradores
pnpm nx list

# Ver geradores específicos
pnpm nx list @nx/nest
pnpm nx list @nx-go/nx-go
```

## 🔄 Release e CI/CD

### Release de Projetos

```bash
# Dry-run para preview (recomendado)
pnpm release:dry-run

# Release completo (via CI/CD automático ao push main)
# Ou manualmente via GitHub Actions UI

# Scripts locais (avançado)
pnpm release:version  # Apenas versionamento
pnpm release:publish  # Apenas publicação
```

### CI/CD Simplificado

O workspace possui uma **arquitetura simplificada de workflows** baseada em Nx Release 20.8.2:

- **🚀 CI otimizado** - Executa apenas projetos afetados com cache inteligente
- **📦 Release automático** - Trigger automático ao push na `main`
- **✅ Validação em PRs** - Dry-run automático para preview
- **🛡️ Quality Gate** - Integração com SonarQube
- **🔧 Menos complexidade** - 60% menos código de workflow

**Arquitetura de Workflows:**
- `ci.yml` - CI para desenvolvimento
- `release.yml` - Release simplificado (~110 linhas)
- `release-validation.yml` - Validação inline para PRs (~65 linhas)
- `_reusable-*` - Componentes reutilizáveis (setup, validate, quality-gate)

**Melhorias vs Versão Anterior:**
- ✅ 60% menos código nos workflows
- ✅ 86% menos scripts customizados
- ✅ 95%+ conformidade com Nx Release best practices
- ✅ Fluxo linear e transparente

Para mais detalhes, consulte:
- [Processo de Release](docs/RELEASE_PROCESS.md)
- [Arquitetura de Workflows](docs/WORKFLOWS_ARCHITECTURE.md)

## 🛠️ Ferramentas de Desenvolvimento

### Biome - Linting e Formatação
O workspace utiliza **Biome** como ferramenta principal para linting e formatação:
- **Linting**: Análise de código com regras configuráveis
- **Formatação**: Formatação automática de código
- **Performance**: Mais rápido que ESLint + Prettier
- **Configuração**: Baseada em `biome.json` e `libs/base-biome/biome.json`

```bash
# Formatar código
pnpm nx format

# Lint com Biome
pnpm nx biome

# Lint completo (Biome + ESLint)
pnpm nx lint
```

### Nx Console
Extensão para VSCode e IntelliJ que melhora a experiência de desenvolvimento:
- Execução de tarefas
- Geração de código
- Autocompletar melhorado

[Instalar Nx Console &raquo;](https://nx.dev/getting-started/editor-setup)

### Comandos Úteis

```bash
# Visualizar grafo de dependências
pnpm nx graph

# Executar tarefas em paralelo
pnpm nx run-many -t build --parallel=3

# Verificar cache
pnpm nx show projects --with-target=build

# Executar CI localmente (simula workflow)
pnpm nx ci

# Verificar projetos afetados
pnpm nx graph --affected

# Coverage de testes (apenas projetos Go)
pnpm nx affected -t coverage
```

## 📖 Recursos Adicionais

- [Documentação Nx](https://nx.dev)
- [Geradores Nx](https://nx.dev/features/generate-code)
- [Nx Release](https://nx.dev/features/manage-releases)
- [Nx Plugins](https://nx.dev/concepts/nx-plugins)

### Comunidade Nx
- [Discord](https://go.nx.dev/community)
- [Twitter](https://twitter.com/nxdevtools)
- [LinkedIn](https://www.linkedin.com/company/nrwl)
- [YouTube](https://www.youtube.com/@nxdevtools)
