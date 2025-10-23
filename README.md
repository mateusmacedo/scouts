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

### Documentação Principal
- **[Resumo do Workspace](docs/WORKSPACE_SUMMARY.md)** - Resumo completo da documentação do workspace e projetos

### Guias de Desenvolvimento
- **[Geradores Nx](docs/NX_GENERATORS.md)** - Como criar novos projetos e usar geradores
- **[Processo de Release](docs/RELEASE_PROCESS.md)** - Como fazer releases dos projetos
- **[Arquitetura de Workflows](docs/WORKFLOWS_ARCHITECTURE.md)** - Arquitetura moderna de CI/CD

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
# Release completo (versionamento independente)
pnpm nx release --specifier=minor

# Dry run para verificar mudanças
pnpm nx release --specifier=minor --dry-run

# Publicar packages
pnpm nx release publish
```

### CI/CD Configurado

O workspace possui uma **arquitetura moderna de workflows CI/CD** baseada em componentes reutilizáveis:

- **🚀 CI otimizado** - Executa apenas projetos afetados com cache inteligente
- **🔧 Workflows reutilizáveis** - Componentes modulares para máxima reutilização
- **📊 Performance** - 50-65% mais rápido que a arquitetura anterior
- **🛡️ Quality Gate** - Integração com SonarQube para análise de qualidade
- **🔄 Release manual** - Controle total via GitHub Actions UI

**Arquitetura de Workflows:**
- `ci.yml` - Orquestrador principal para validação
- `release.yml` - Release manual com validações completas
- `release-validation.yml` - Validação para branches de release
- `_reusable-*` - Componentes reutilizáveis (setup, validate, quality-gate, release-steps)

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
