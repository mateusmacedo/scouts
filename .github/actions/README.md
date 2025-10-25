# Composite Actions

Este diretório contém as composite actions reutilizáveis para os workflows CI/CD do projeto Scouts.

## Actions Disponíveis

### setup-node-pnpm

**Propósito:** Configuração otimizada do Node.js e pnpm com cache inteligente.

**Inputs:**
- `node-version` (opcional): Versão do Node.js (padrão: 20)
- `pnpm-version` (opcional): Versão do pnpm (padrão: 9.15.0)

**Outputs:**
- `cache-hit`: Indica se o cache foi encontrado
- `store-path`: Caminho do diretório de store do pnpm

**Exemplo de uso:**
```yaml
- name: Setup Node.js and pnpm
  uses: ./.github/actions/setup-node-pnpm
  id: node-pnpm-setup
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### setup-go

**Propósito:** Configuração condicional do Go com cache otimizado para módulos.

**Inputs:**
- `go-version` (opcional): Versão do Go (padrão: 1.23)
- `has-go-changes` (opcional): Se há mudanças em Go (padrão: false)

**Outputs:**
- `cache-hit`: Indica se o cache Go foi encontrado
- `go-modules-exist`: Se existem módulos Go no workspace

**Exemplo de uso:**
```yaml
- name: Setup Go
  uses: ./.github/actions/setup-go
  with:
    has-go-changes: ${{ steps.changes.outputs.has_go_changes }}
  id: go-setup
```

### restore-nx-cache

**Propósito:** Restauração do cache Nx para builds e testes mais rápidos.

**Inputs:**
- `cache-key` (opcional): Chave customizada (padrão: github.sha)

**Outputs:**
- `cache-hit`: Indica se o cache Nx foi encontrado

**Exemplo de uso:**
```yaml
- name: Restore Nx cache
  uses: ./.github/actions/restore-nx-cache
  id: nx-cache
```

### setup-playwright

**Propósito:** Configuração do Playwright com cache de browsers.

**Inputs:**
- `install-browsers` (opcional): Se deve instalar browsers (padrão: true)

**Outputs:**
- `cache-hit`: Indica se o cache Playwright foi encontrado

**Exemplo de uso:**
```yaml
- name: Setup Playwright
  uses: ./.github/actions/setup-playwright
  with:
    install-browsers: 'true'
  id: playwright-setup
```

### cache-manager

**Propósito:** Gerenciamento centralizado de cache com chaves hierárquicas.

**Inputs:**
- `key` (obrigatório): Componente principal da chave de cache
- `path` (obrigatório): Caminho(s) a serem cacheados
- `prefix` (obrigatório): Prefixo para a chave de cache
- `lookup-only` (opcional): Se deve apenas restaurar (padrão: false)

**Outputs:**
- `cache-hit`: Indica se o cache foi encontrado

**Exemplo de uso:**
```yaml
- name: Cache dependencies
  uses: ./.github/actions/cache-manager
  with:
    path: ${{ steps.pnpm-cache-dir.outputs.STORE_PATH }}
    prefix: pnpm
    key: ${{ hashFiles('**/pnpm-lock.yaml') }}
```

## Métricas de Cache

Cada action fornece métricas de cache que podem ser usadas para monitoramento:

- **Cache Hit Rate:** Percentual de hits de cache
- **Cache Miss:** Quando o cache não é encontrado
- **Restore Keys:** Chaves de restauração hierárquica

## Configuração

### Secrets Necessários

- `GH_TOKEN`: Token de autenticação geral
- `NPM_TOKEN`: Token para publicação no npmjs.org
- `SONAR_TOKEN`: Token para SonarCloud

### Variáveis de Ambiente

- `NODE_AUTH_TOKEN`: Para autenticação com registries privados
- `SONARQUBE_HOST`: Host do SonarCloud (padrão: https://sonarcloud.io)

## Troubleshooting

### Cache Miss Frequente

1. Verificar se as chaves de cache são consistentes
2. Verificar se os paths estão corretos
3. Verificar se os restore-keys estão configurados

### Falhas de Setup

1. Verificar se os secrets estão configurados
2. Verificar se as versões são compatíveis
3. Verificar logs de erro nos steps

### Performance

1. Usar cache hierárquico quando possível
2. Configurar timeouts apropriados
3. Usar paralelização quando possível
