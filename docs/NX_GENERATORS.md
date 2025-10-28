# Usando Geradores Nx

Este documento descreve como usar os geradores Nx disponíveis no workspace para criar novos projetos e automatizar tarefas comuns.

## 🚀 Geradores Principais


### Gerar Nova Biblioteca

```bash
# TypeScript/Node.js
pnpm nx g @nx/js:library my-lib

# NestJS
pnpm nx g @nx/nest:library my-nest-lib

# Go
pnpm nx g @nx-go/nx-go:library my-go-lib
```

**📋 Geradores Disponíveis no Workspace:**
- `@nx/js` - Bibliotecas e aplicações JavaScript/TypeScript
- `@nx/nest` - Aplicações e bibliotecas NestJS
- `@nx/node` - Aplicações e bibliotecas Node.js
- `@nx-go/nx-go` - Aplicações e bibliotecas Go
- `@nx/webpack` - Configuração Webpack
- `@nx/jest` - Configuração Jest
- `@nx/eslint` - Configuração ESLint
- `@nx/workspace` - Utilitários do workspace

**📦 Plugins Instalados:**
- `@nestjs/schematics` - Geradores NestJS
- `@nx-go/nx-go` - Suporte Go
- `@nx/eslint` - Linting ESLint
- `@nx/jest` - Testes Jest
- `@nx/js` - JavaScript/TypeScript
- `@nx/nest` - NestJS
- `@nx/node` - Node.js
- `@nx/web` - Web
- `@nx/webpack` - Webpack

### Gerar Nova Aplicação

```bash
# NestJS
pnpm nx g @nx/nest:application my-app

# Node.js
pnpm nx g @nx/node:application my-node-app

# Go
pnpm nx g @nx-go/nx-go:application my-go-app
```

## 🎯 Exemplos Específicos do Workspace

### Criar Nova Biblioteca TypeScript

```bash
# Biblioteca simples (similar a libs/user-node)
pnpm nx g @nx/js:library shared-utils --directory=libs/shared-utils

# Biblioteca com configuração específica
pnpm nx g @nx/js:library api-client \
  --directory=libs/api-client \
  --bundler=rollup \
  --unitTestRunner=jest \
  --linter=eslint
```

### Criar Nova Biblioteca NestJS

```bash
# Biblioteca NestJS (similar a libs/utils-nest)
pnpm nx g @nx/nest:library auth-utils --directory=libs/auth-utils
```

### Criar Nova Biblioteca Go

```bash
# Biblioteca Go simples (similar a libs/user-go)
pnpm nx g @nx-go/nx-go:library go-utils --directory=libs/go-utils

# Biblioteca Go com testes
pnpm nx g @nx-go/nx-go:library go-validator \
  --directory=libs/go-validator \
  --withTests=true
```

### Criar Nova Aplicação

```bash
# Aplicação NestJS (similar a apps/bff-nest)
pnpm nx g @nx/nest:application api-gateway --directory=apps/api-gateway

# Aplicação Go (similar a apps/user-go-service)
pnpm nx g @nx-go/nx-go:application go-service --directory=apps/go-service
```

## ⚙️ Geradores de Configuração

### Configurar ESLint

```bash
# Configurar ESLint para um projeto específico
pnpm nx g @nx/eslint:configuration --project=my-project
```

> **Nota:** O workspace utiliza Biome como ferramenta principal de linting, com ESLint como complemento para regras específicas.

### Configurar Jest

```bash
# Configurar Jest para um projeto específico
pnpm nx g @nx/jest:configuration --project=my-project
```

### Configurar Webpack

```bash
# Configurar Webpack para um projeto específico
pnpm nx g @nx/webpack:configuration --project=my-project
```

## 🔄 Geradores de Migração

### Migrar para Inferred Tasks

```bash
# Migrar projeto para usar inferred tasks
pnpm nx g @nx/workspace:convert-to-inferred --project=my-project
```

### Migrar para Project Crystal

```bash
# Migrar para Project Crystal (Nx 19+)
pnpm nx g @nx/workspace:convert-to-project-crystal --project=my-project
```

## 📦 Geradores de Release

### Configurar Release para Projeto

```bash
# Adicionar configuração de release para um projeto
pnpm nx g @nx/js:release-config --project=my-project
```

### Configurar Changelog

```bash
# Configurar changelog para um projeto
pnpm nx g @nx/js:changelog --project=my-project
```



## 📚 Geradores de Documentação

### Gerar README

```bash
# Gerar README para um projeto
pnpm nx g @nx/workspace:readme --project=my-project
```

> **Nota:** Geradores de documentação podem não estar disponíveis no workspace atual.

## 🧪 Geradores de Testes

### Gerar Testes E2E

```bash
# Testes E2E com Cypress
pnpm nx g @nx/cypress:configuration --project=my-app
```

> **Nota:** Playwright não está configurado no workspace atual.

### Gerar Testes de Integração

```bash
# Testes de integração
pnpm nx g @nx/jest:configuration --project=my-project --testEnvironment=node
```

## ⚡ Geradores de Performance

### Configurar Bundle Analyzer

```bash
# Bundle analyzer para webpack
pnpm nx g @nx/webpack:bundle-analyzer --project=my-app
```

> **Nota:** Lighthouse não está configurado no workspace atual.

## 🔒 Geradores de Segurança

### Configurar Snyk

```bash
# Snyk para análise de vulnerabilidades
pnpm nx g @nx/workspace:snyk-config
```

### Configurar Dependabot

```bash
# Dependabot para atualizações automáticas
pnpm nx g @nx/workspace:dependabot-config
```

> **Nota:** Geradores de segurança podem não estar disponíveis no workspace atual.

## 📊 Geradores de Monitoramento

### Configurar Sentry

```bash
# Sentry para monitoramento de erros
pnpm nx g @nx/sentry:configuration --project=my-app
```

### Configurar Analytics

```bash
# Google Analytics
pnpm nx g @nx/workspace:analytics-config --project=my-app
```

> **Nota:** Geradores de monitoramento podem não estar disponíveis no workspace atual.

## 🛠️ Comandos Úteis

### Listar Geradores Disponíveis

```bash
# Listar todos os geradores
pnpm nx list

# Listar geradores de um plugin específico
pnpm nx list @nx/js
pnpm nx list @nx/nest
pnpm nx list @nx-go/nx-go
pnpm nx list @nx/webpack
pnpm nx list @nx/jest
```

### Ver Ajuda de um Gerador

```bash
# Ver opções de um gerador
pnpm nx g @nx/js:library --help
```

### Executar Gerador com Dry Run

```bash
# Ver o que seria gerado sem executar
pnpm nx g @nx/js:library my-lib --dry-run
```

## 🚀 Exemplos Avançados

### Criar Workspace Plugin

```bash
# Criar plugin customizado
pnpm nx g @nx/plugin:plugin tools/my-plugin

# Adicionar gerador ao plugin
pnpm nx g @nx/plugin:generator my-generator --project=tools/my-plugin
```

### Criar Executor Customizado

```bash
# Criar executor customizado
pnpm nx g @nx/plugin:executor my-executor --project=tools/my-plugin
```

### Criar Schematic Customizado

```bash
# Criar schematic customizado
pnpm nx g @nx/plugin:schematic my-schematic --project=tools/my-plugin
```

## ✅ Boas Práticas

1. **Sempre use `--dry-run`** antes de executar geradores em produção
2. **Documente geradores customizados** com exemplos de uso
3. **Teste geradores** em ambiente de desenvolvimento primeiro
4. **Use convenções de nomenclatura** consistentes
5. **Mantenha geradores atualizados** com as versões do Nx
6. **Use pnpm** em vez de npm para consistência com o workspace

## 🔧 Troubleshooting

### Gerador não encontrado

```bash
# Verificar se o plugin está instalado
pnpm nx list @nx/js

# Instalar plugin se necessário
pnpm install @nx/js
```

### Erro de permissão

```bash
# Verificar permissões de escrita
ls -la

# Executar com sudo se necessário (não recomendado)
sudo pnpm nx g @nx/js:library my-lib
```

### Gerador falha

```bash
# Ver logs detalhados
pnpm nx g @nx/js:library my-lib --verbose

# Verificar dependências
pnpm ls @nx/js
```

## 📖 Recursos Adicionais

- [Nx Generators Documentation](https://20.nx.dev/features/generate-code)
- [Creating Custom Generators](https://20.nx.dev/recipes/generators/local-generators)
- [Nx Plugin Development](https://20.nx.dev/recipes/generators/workspace-generators)
- [Generator Best Practices](https://20.nx.dev/recipes/generators/generator-options)
