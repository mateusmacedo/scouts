# Resumo da Documentação do Workspace Scouts

## 📋 Visão Geral

O **Scouts** é um monorepo Nx moderno para desenvolvimento de aplicações e bibliotecas com suporte a **TypeScript**, **Go** e **NestJS**. O workspace implementa uma arquitetura completa de logging estruturado, utilitários para NestJS e bibliotecas de usuários para diferentes tecnologias.

### Características Principais

- 🏗️ **Monorepo Nx** - Gerenciamento eficiente de múltiplos projetos
- 🔧 **Polyglot** - Suporte a TypeScript/Node.js, Go e NestJS
- 📦 **Versionamento Independente** - Cada biblioteca tem seu próprio versionamento
- 🚀 **CI/CD Moderno** - Arquitetura de workflows componentizada e otimizada
- 🔍 **Logging Estruturado** - Sistema completo de logging com correlation IDs
- ⚡ **Performance** - Cache otimizado e execução apenas de projetos afetados
- 🛡️ **Quality Gate** - Integração com SonarQube e análise de qualidade

---

## 🏗️ Estrutura do Workspace

### Aplicações

#### 1. **apps/bff-nest** - Backend for Frontend em NestJS
- **Descrição**: Aplicação NestJS que demonstra integração completa com logger-node
- **Tags**: `type:app`, `scope:internal`
- **Características**:
  - Logging estruturado com `@scouts/logger-node`
  - Suporte a Correlation ID em todas as requisições
  - Redação automática de dados sensíveis
  - Health checks e monitoring endpoints
  - Gerenciamento de usuários (CRUD)
  - Métricas de logging

#### 2. **apps/user-go-service** - Serviço de Usuários em Go
- **Descrição**: Serviço de usuários implementado em Go
- **Tags**: `type:app`, `scope:internal`
- **Module Path**: `github.com/mateusmacedo/scouts/apps/user-go-service`

### Bibliotecas

#### 1. **@scouts/logger-node** - Sistema de Logging Modular
- **Descrição**: Biblioteca de logging modular e desacoplada para Node.js
- **Tags**: `npm:public`, `type:lib`, `scope:internal`
- **Características**:
  - Padrão Proxy para composição modular
  - Correlation IDs com AsyncLocalStorage
  - Redação automática de dados sensíveis
  - Métricas de performance e volume
  - Suporte a múltiplos sinks (console, pino, custom)
  - Type-safe com TypeScript
- **Publicação**: npm registry (npmjs.org)
- **Funcionalidades principais**:
  - `createLogger()` - Logger base
  - `attachMetrics()` - Coleta de métricas
  - `attachRedactor()` - Redação de dados sensíveis
  - `attachSink()` - Destino de logs
  - Context module para tracking de correlation IDs

#### 2. **@scouts/utils-nest** - Utilitários para NestJS
- **Descrição**: Biblioteca de utilitários para NestJS com módulos completos
- **Tags**: `npm:public`, `type:lib`, `scope:internal`
- **Módulos**:
  - **Health Check Module**: Health checks com Terminus (HTTP, Memory, Disk)
  - **Swagger Module**: Configuração avançada de documentação OpenAPI
  - **Logger Module**: Adapter para `@scouts/logger-node` com NestJS
- **Publicação**: npm registry (npmjs.org)
- **Endpoints Health**:
  - `/health/live` - Liveness probe
  - `/health/ready` - Readiness probe
  - Compatível com Kubernetes

#### 3. **@scouts/user-node** - Biblioteca de Usuários para Node.js
- **Descrição**: Biblioteca básica de usuários para Node.js
- **Tags**: `npm:public`, `type:lib`, `scope:internal`
- **Status**: Funcionalidade básica implementada
- **Publicação**: npm registry (npmjs.org)
- **Roadmap**:
  - User Entity e Service
  - User Validation
  - User Events
  - User Repository

#### 4. **scouts/user-go** - Biblioteca de Usuários para Go
- **Descrição**: Biblioteca Go para gerenciamento básico de usuários
- **Tags**: `go:public`, `type:lib`, `scope:internal`
- **Module Path**: `github.com/mateusmacedo/scouts/libs/user-go`
- **Versionamento**: Via git tags (ex: `scouts/user-go@v0.1.0`)
- **Características**:
  - Interface Go idiomática
  - Performance otimizada
  - Suporte nativo à concorrência
- **Roadmap**:
  - User Struct
  - User Service e Repository
  - Suporte a context.Context

#### 5. **@scouts/base-biome** - Configuração Base do Biome
- **Descrição**: Configuração base do Biome para linting e formatação
- **Tags**: `npm:private`, `type:lib`, `scope:internal`
- **Status**: Não publicada, uso interno

---

## 🔧 Arquitetura de Logging

O workspace implementa uma **stack completa de logging estruturado** com três camadas:

### Camada 1: logger-node (Base)
- Biblioteca base com padrão Proxy
- Composição modular de funcionalidades
- Correlation IDs com AsyncLocalStorage
- Redação de dados sensíveis

### Camada 2: utils-nest (Adapter)
- Adapter NestJS para logger-node
- Decorators (`@Log`, `@LogInfo`, etc.)
- Middleware de Correlation ID
- Integração com NestJS LoggerService

### Camada 3: bff-nest (Demonstração)
- Aplicação completa com logging integrado
- Exemplos de uso em controllers e services
- Monitoring endpoints
- Métricas e health checks

### Características Principais
- 🔍 **Logging estruturado** com correlation IDs
- 🔒 **Redação automática** de dados sensíveis (password, token, cardNumber)
- 📊 **Métricas** de performance e volume
- 🧩 **Integração nativa** com NestJS
- 🎯 **Múltiplos sinks** (console, pino, custom)
- ⚡ **High-performance** com AsyncLocalStorage

---

## 📊 Sistema de Tags

Os projetos utilizam tags para categorização e controle de publicação:

### Tags de Publicação
- **`npm:public`** - Publicado no npm registry (npmjs.org)
- **`npm:private`** - Não publicado, uso interno
- **`go:public`** - Biblioteca Go versionada via git tags

### Tags de Tipo
- **`type:lib`** - Biblioteca
- **`type:app`** - Aplicação

### Tags de Escopo
- **`scope:internal`** - Escopo interno do workspace

---

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
```

### Verificar Projetos
```bash
# Ver todos os projetos
pnpm nx show projects

# Ver detalhes de um projeto específico
pnpm nx show project bff-nest

# Visualizar grafo de dependências
pnpm nx graph
```

---

## 🔄 Processo de Release

### Versionamento Automático
O Nx Release utiliza **Conventional Commits** para determinar automaticamente o tipo de versão:

- **`feat(scope): description`** → minor bump (0.0.0 → 0.1.0)
- **`fix(scope): description`** → patch bump (0.1.0 → 0.1.1)
- **`feat!:` ou `BREAKING CHANGE:`** → major bump (0.1.0 → 1.0.0)

### Release Manual via GitHub Actions
O release é executado **manualmente** via GitHub Actions UI para maior segurança:

1. Acesse GitHub Actions → Workflows → "Release"
2. Clique em "Run workflow"
3. Configure os inputs:
   - `dry-run`: true (padrão) para simular
   - `version-specifier`: deixe vazio para auto
   - `skip-validation`: false (recomendado)
4. Execute o workflow

### Projetos Incluídos no Release

**Libs TypeScript (publicadas no npm):**
- `@scouts/logger-node`
- `@scouts/utils-nest`
- `@scouts/user-node`

**Lib Go (versionada via git tags):**
- `scouts/user-go`

**Apps (versionados mas não publicados):**
- `@scouts/bff-nest`
- `scouts/user-go-service`

### Validações Automáticas
O script `validate-release-consistency.sh` verifica:
- ✅ Mudanças não comitadas
- ✅ Sincronização de versões Go
- ✅ Build de todos os projetos
- ✅ Testes passando
- ✅ Linting OK
- ✅ Tags git não conflitantes

---

## 🏗️ Arquitetura de Workflows CI/CD

### Estrutura Moderna e Componentizada
```
.github/workflows/
├── ci.yml                      # Orquestrador principal
├── release.yml                 # Release manual
├── release-validation.yml      # Validação para branches release/**
│
├── _reusable-setup.yml        # Setup comum com cache
├── _reusable-validate.yml     # Validação (lint, test, build)
├── _reusable-quality-gate.yml # Quality gate + SonarQube
└── _reusable-release-steps.yml # Passos de release
```

### Princípios de Design
1. **DRY** - Setup e cache centralizados
2. **Single Responsibility** - Cada workflow tem propósito específico
3. **Composability** - Workflows facilmente combinados
4. **Naming Convention** - `_reusable-*` para workflows internos
5. **Cache Centralizado** - Configuração única de cache

### Workflows Orquestradores

#### 1. CI Workflow (`ci.yml`)
- **Trigger**: Push para `develop`, `feature/**`, `bugfix/**`, `hotfix/**`; PR para `develop`, `main`
- **Função**: Validação básica para desenvolvimento
- **Execução**: Apenas projetos afetados com cache

#### 2. Release Workflow (`release.yml`)
- **Trigger**: Apenas manual dispatch
- **Função**: Release 100% manual para máxima segurança
- **Características**: Validações completas, rollback automático

#### 3. Release Validation Workflow (`release-validation.yml`)
- **Trigger**: PR e push para `release/**`
- **Função**: Validação completa para branches de release
- **Fluxo**: Validate → Quality Gate → Release Dry-run

### Benefícios da Arquitetura
- 🚀 **50-65% mais rápido** que arquitetura anterior
- 🔧 **70% menos código duplicado**
- 💰 **~750 minutos/mês economizados** em runners
- 🎯 **Cache otimizado** (90% pnpm, 85% Nx, 80% Go)
- 🛡️ **Quality Gate** integrado com SonarQube

---

## 🛠️ Ferramentas de Desenvolvimento

### Biome - Linting e Formatação
- **Linting**: Análise de código com regras configuráveis
- **Formatação**: Formatação automática
- **Performance**: Mais rápido que ESLint + Prettier
- **Configuração**: `biome.json` e `libs/base-biome/biome.json`

```bash
# Formatar código
pnpm nx format

# Lint com Biome
pnpm nx biome

# Lint completo (Biome + ESLint)
pnpm nx lint
```

### Nx Console
Extensão para VSCode e IntelliJ:
- Execução de tarefas
- Geração de código
- Autocompletar melhorado

### Comandos Úteis
```bash
# Executar CI localmente
pnpm nx ci

# Verificar projetos afetados
pnpm nx graph --affected

# Executar tarefas em paralelo
pnpm nx run-many -t build --parallel=3

# Coverage de testes (projetos Go)
pnpm nx affected -t coverage
```

---

## 📚 Documentação Disponível

### Guias de Desenvolvimento
1. **[README.md](../README.md)** - Visão geral do workspace
2. **[NX_GENERATORS.md](NX_GENERATORS.md)** - Como criar novos projetos e usar geradores
3. **[RELEASE_PROCESS.md](RELEASE_PROCESS.md)** - Processo completo de release
4. **[WORKFLOWS_ARCHITECTURE.md](WORKFLOWS_ARCHITECTURE.md)** - Arquitetura de CI/CD

### Documentação de Projetos

#### Aplicações
- **[apps/bff-nest/README.md](../apps/bff-nest/README.md)** - BFF NestJS com logging completo
- **[apps/user-go-service/README.md](../apps/user-go-service/README.md)** - Serviço Go de usuários

#### Bibliotecas
- **[libs/logger-node/README.md](../libs/logger-node/README.md)** - Sistema de logging modular
- **[libs/utils-nest/README.md](../libs/utils-nest/README.md)** - Utilitários NestJS
- **[libs/user-node/README.md](../libs/user-node/README.md)** - Biblioteca de usuários Node.js
- **[libs/user-go/README.md](../libs/user-go/README.md)** - Biblioteca de usuários Go
- **[libs/biome-base/README.md](../libs/biome-base/README.md)** - Configuração Biome

---

## 🎯 Geradores Nx

### Criar Novos Projetos

#### Aplicações
```bash
# NestJS
pnpm nx g @nx/nest:application nova-app

# Go
pnpm nx g @nx-go/nx-go:application nova-go-app
```

#### Bibliotecas
```bash
# TypeScript
pnpm nx g @nx/js:library nova-lib

# NestJS
pnpm nx g @nx/nest:library nova-nest-lib

# Go
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

---

## 📦 Tecnologias Utilizadas

### Frontend/Backend
- **NestJS** - Framework Node.js para APIs
- **TypeScript** - Linguagem principal
- **Express** - Web framework

### Go
- **Go 1.x** - Linguagem de programação
- **Module system** - Gerenciamento de dependências

### Build Tools
- **Nx** - Monorepo build system
- **Webpack** - Module bundler
- **SWC** - Compilador TypeScript/JavaScript
- **pnpm** - Package manager

### Testing
- **Jest** - Testing framework (TypeScript)
- **Go testing** - Testing framework (Go)

### Linting/Formatting
- **Biome** - Linter e formatter principal
- **ESLint** - Linter complementar
- **Prettier** - Formatter

### CI/CD
- **GitHub Actions** - CI/CD pipeline
- **SonarQube** - Análise de qualidade
- **Verdaccio** - Registro npm local (dev)

---

## 🔐 Segurança

### Data Redaction
Campos automaticamente redatados:
- `password`
- `token`
- `cardNumber`
- `ssn`
- Campos customizados via configuração

### Correlation ID
- Tracking de requisições end-to-end
- AsyncLocalStorage para propagação de contexto
- Suporte a múltiplos headers:
  - `x-correlation-id`
  - `x-request-id`
  - `x-trace-id`
  - `correlation-id`
  - `request-id`

---

## 📊 Métricas e Monitoramento

### Health Checks
- Liveness probes: `/health/live`
- Readiness probes: `/health/ready`
- Indicadores: HTTP, Memory, Disk
- Compatibilidade Kubernetes

### Logger Metrics
```json
{
  "logsWritten": 150,
  "errorCount": 2,
  "uptimeMs": 30000,
  "memoryUsage": {
    "rss": 45,
    "heapTotal": 20,
    "heapUsed": 15
  }
}
```

---

## 🚀 Próximos Passos e Roadmap

### Workspace
1. **Dependabot** - Atualizações automáticas
2. **Slack/Teams** - Notificações de release
3. **Monitoramento** - Sentry, Analytics

### Bibliotecas
1. **user-node** - Implementar User Entity, Service, Validation
2. **user-go** - Implementar User Struct, Service, Context support
3. **utils-nest** - Custom health indicators, Circuit breakers

---

## 📖 Recursos Adicionais

### Documentação Oficial
- [Nx Documentation](https://nx.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Go Documentation](https://go.dev/doc)

### Comunidade
- [Nx Discord](https://go.nx.dev/community)
- [NestJS Discord](https://discord.gg/nestjs)

### Ferramentas
- [Nx Console](https://nx.dev/getting-started/editor-setup)
- [Biome](https://biomejs.dev)
- [Verdaccio](https://verdaccio.org)

---

## 🤝 Contribuição

### Processo
1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças (seguindo Conventional Commits)
4. Push para a branch
5. Abra um Pull Request

### Padrões
- **Commits**: Conventional Commits
- **Código**: Clean Code, SOLID
- **Testes**: Cobertura mínima de 75%
- **Documentação**: README.md atualizado

---

## 📄 Licença

MIT - © Mateus Macedo Dos Anjos

---

**Última Atualização**: 2024-10-23  
**Versão do Nx**: 20.8.2  
**Node.js**: 18.16.9  
**pnpm**: 9.15.0
