# Configuração de Cache Nx

Este documento descreve a configuração de cache no template Nx e as possibilidades de customização.

## Benefícios e Impacto

O sistema de cache do Nx oferece benefícios significativos:

- **Redução de tempo de build em 50-90%**: Cache inteligente evita rebuilds desnecessários
- **Reutilização de resultados entre desenvolvedores**: Compartilhamento de artefatos de build
- **Cache inteligente baseado em inputs**: Invalidação automática apenas quando necessário

## Configuração Atual

### Cache Local

O cache está configurado para usar o diretório local `.nx/cache`:

```json
{
  "cacheDirectory": ".nx/cache"
}
```

### Named Inputs

Os inputs nomeados definem quais arquivos são considerados para invalidar o cache:

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.spec.ts", "!{projectRoot}/**/*.test.ts"],
    "testing": ["{projectRoot}/**/*.spec.ts", "{projectRoot}/**/*.test.ts"],
    "linting": ["{projectRoot}/**/*.ts", "{projectRoot}/**/*.js"],
    "go": ["{projectRoot}/**/*.go", "{projectRoot}/go.mod", "{projectRoot}/go.sum", "{workspaceRoot}/go.work", "{workspaceRoot}/go.work.sum"],
    "certificates": ["{workspaceRoot}/docs/certificates/**/*.md"],
    "sharedGlobals": [
      "{workspaceRoot}/go.work",
      "{workspaceRoot}/go.work.sum", 
      "{workspaceRoot}/pnpm-lock.yaml",
      "{workspaceRoot}/nx.json",
      "{workspaceRoot}/tsconfig.base.json",
      "{workspaceRoot}/jest.config.ts",
      "{workspaceRoot}/jest.preset.js",
      "{workspaceRoot}/biome.json",
      "{workspaceRoot}/eslint.config.mjs"
    ]
  }
}
```

### Target Defaults

Configurações globais para cache de targets:

```json
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production", "sharedGlobals"],
      "outputs": ["{workspaceRoot}/dist/{projectRoot}", "{projectRoot}/dist"]
    },
    "test": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["default", "^production", "testing", "sharedGlobals"],
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"]
    },
    "lint": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["linting", "sharedGlobals"]
    },
    "biome-check": {
      "cache": true
    }
  }
}
```

## Customizações de Cache

### 1. Mudança de Localização

Para alterar o diretório de cache:

```json
{
  "cacheDirectory": "/tmp/nx-cache"
}
```

### 2. Cache Remoto

Para usar cache remoto (Nx Cloud, S3, GCS):

```json
{
  "nxCloudUrl": "https://cloud.nx.dev",
  "nxCloudAccessToken": "your-token"
}
```

### 3. Configuração por Ambiente

#### Desenvolvimento Local

```bash
# Usar cache local
export NX_CACHE_DIRECTORY=.nx/cache
```

#### CI/CD

```bash
# Usar cache remoto
export NX_CLOUD_ACCESS_TOKEN=your-token
export NX_CLOUD_URL=https://cloud.nx.dev
```

#### Docker

```dockerfile
# Montar cache como volume
VOLUME ["/app/.nx/cache"]
```

## Estratégias de Cache

### 1. Cache por Projeto

Cada projeto tem seu próprio cache baseado em:
- Arquivos de código fonte
- Dependências (package.json, go.mod)
- Configurações (tsconfig, jest.config)
- Arquivos globais (nx.json, pnpm-lock.yaml)

### 2. Cache por Target

Diferentes targets têm diferentes estratégias:

- **build**: Cache baseado em código fonte e dependências
- **test**: Cache baseado em código fonte, testes e configurações
- **lint**: Cache baseado em código fonte e configurações de lint
- **serve**: Sem cache (sempre executa)

### 3. Cache por Runtime

- **Node.js**: Baseado em package.json, tsconfig, código TypeScript
- **Go**: Baseado em go.mod, go.sum, código Go, go.work
- **Universal**: Baseado em configurações compartilhadas

## Monitoramento de Cache

### 1. Verificar Cache Hits

```bash
# Executar com verbose para ver cache hits
nx run-many -t build --verbose

# Ver estatísticas de cache
nx show project <project-name> --web
```

### 2. Limpar Cache

```bash
# Limpar cache local
nx reset

# Limpar cache específico
rm -rf .nx/cache
```

### 3. Debug de Cache

```bash
# Verificar inputs de um target
nx show project <project-name> --web

# Verificar se cache está funcionando
nx run-many -t build --verbose
```

## Otimizações de Cache

### 1. Inputs Otimizados

- **Incluir apenas arquivos relevantes**: Evitar arquivos que não afetam o build
- **Excluir arquivos desnecessários**: Testes, documentação, assets estáticos
- **Usar namedInputs**: Reutilizar configurações comuns

### 2. Outputs Otimizados

- **Especificar outputs corretos**: Garantir que todos os artefatos sejam capturados
- **Evitar outputs desnecessários**: Não incluir arquivos temporários
- **Usar paths relativos**: Facilitar portabilidade

### 3. Dependências Otimizadas

- **dependsOn corretos**: Garantir ordem de execução
- **^build para libs**: Buildar dependências antes
- **Evitar dependências circulares**: Quebrar ciclos desnecessários

## Troubleshooting

### Problema: Cache Miss Inesperado

**Sintomas:**
- Target executa mesmo sem mudanças
- Build demora mais que esperado

**Soluções:**
1. Verificar inputs: `nx show project <name> --web`
2. Verificar se arquivos estão sendo incluídos incorretamente
3. Limpar cache: `nx reset`
4. Verificar dependências: `nx graph`

### Problema: Cache Hit Incorreto

**Sintomas:**
- Build não reflete mudanças recentes
- Testes passam quando deveriam falhar

**Soluções:**
1. Verificar se inputs estão corretos
2. Verificar se outputs estão sendo capturados
3. Limpar cache: `nx reset`
4. Verificar se dependências estão corretas

### Problema: Cache Muito Grande

**Sintomas:**
- Diretório `.nx/cache` muito grande
- Espaço em disco insuficiente

**Soluções:**
1. Limpar cache antigo: `nx reset`
2. Configurar limpeza automática
3. Usar cache remoto para CI/CD
4. Excluir arquivos desnecessários dos inputs

## Configuração Avançada

### 1. Cache por Branch

```json
{
  "cacheDirectory": ".nx/cache-{branch}"
}
```

### 2. Cache com TTL

```json
{
  "cacheDirectory": ".nx/cache",
  "cacheMaxAge": "7d"
}
```

### 3. Cache Distribuído

```json
{
  "nxCloudUrl": "https://cloud.nx.dev",
  "nxCloudAccessToken": "your-token",
  "nxCloudDistributedExecution": true
}
```

## Boas Práticas

1. **Sempre especifique inputs e outputs** para targets customizados
2. **Use namedInputs** para reutilizar configurações
3. **Monitore cache hits** regularmente
4. **Limpe cache** quando necessário
5. **Configure cache remoto** para CI/CD
6. **Documente exceções** de cache quando necessário
7. **Teste configurações** em ambiente isolado antes de aplicar

## Referências

- [Nx Cache Documentation](https://nx.dev/features/cache-task-results)
- [Nx Cloud Documentation](https://nx.dev/features/ci-features/remote-cache)
- [Task Pipeline Documentation](https://nx.dev/concepts/task-pipeline-configuration)

