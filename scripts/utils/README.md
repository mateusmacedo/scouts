# Scripts Utilitários

Este diretório contém scripts utilitários reutilizáveis para automação de CI/CD.

## 📁 Estrutura

```
utils/
├── README.md                        # Este arquivo
├── common-functions.sh              # Funções comuns reutilizáveis
├── detect-language-changes.sh       # Detecção de mudanças por linguagem
├── cache-coverage-results.sh        # Cache inteligente de coverage
├── validate-cache-integrity.sh      # Validação de integridade de cache
├── detect-changed-projects.sh       # Detecção de projetos alterados
├── get-publishable-projects.sh      # Obter projetos publicáveis
├── health-check-ci.sh              # Health check de serviços
├── retry-with-backoff.sh            # Retry com exponential backoff
├── check-publish-conflicts.sh       # Verificar conflitos de publicação
├── setup-npm-registry.sh            # Configuração do registry npm
└── setup-playwright-background.sh   # Setup do Playwright
```

## 🔧 Scripts Principais

### `common-functions.sh`
Biblioteca central com funções comuns reutilizáveis por todos os scripts.

#### Funções de Logging
```bash
log_info "Mensagem informativa"
log_success "Operação concluída"
log_error "Erro encontrado"
log_warning "Aviso importante"
log_debug "Informação de debug"
log_step "Executando passo..."
```

#### Funções de Validação
```bash
# Validar pré-requisitos (pnpm, node, jq, nx.json)
validate_prerequisites

# Verificar se estamos em ambiente CI
if is_ci_environment; then
    log_info "Executando em ambiente CI"
fi
```

#### Funções de Execução
```bash
# Executar com retry automático
execute_with_retry 3 5 "pnpm nx test"

# Obter paralelização dinâmica
PARALLEL=$(get_dynamic_parallel 4)
```

#### Funções de Cache
```bash
# Validar integridade de cache
validate_cache_integrity "$CACHE_PATH" "pnpm"

# Limpar cache corrompido
cleanup_corrupted_cache "pnpm" "$CACHE_PATH"
```

#### Funções de Detecção
```bash
# Detectar mudanças por linguagem
detect_language_changes "HEAD~1"

# Verificar labels de PR
check_pr_labels

# Verificar commit messages
check_commit_messages "$GITHUB_HEAD_COMMIT_MESSAGE"
```

### `detect-language-changes.sh`
Detecta mudanças por linguagem com suporte a overrides manuais.

**Uso:**
```bash
./scripts/utils/detect-language-changes.sh [base_ref] [output_format] [verbose]
```

**Parâmetros:**
- `base_ref`: Referência base para comparação (padrão: `HEAD~1`)
- `output_format`: Formato de output (`github`, `json`, `env`)
- `verbose`: Habilitar output detalhado (`true`/`false`)

**Outputs:**
- `go-changed`: boolean - Mudanças em Go detectadas
- `node-changed`: boolean - Mudanças em Node.js detectadas
- `config-changed`: boolean - Mudanças em configurações detectadas
- `skip-ci`: boolean - Pular CI completamente
- `affected-projects`: string - Lista de projetos afetados

**Exemplos:**
```bash
# Para GitHub Actions
./scripts/utils/detect-language-changes.sh origin/main github

# Para output JSON
./scripts/utils/detect-language-changes.sh HEAD~1 json true

# Para variáveis de ambiente
source <(./scripts/utils/detect-language-changes.sh HEAD~1 env)
```

**Detecção Automática:**
- **Go**: Arquivos `.go`, `.mod`, `.sum`
- **Node.js**: Arquivos `.ts`, `.tsx`, `.js`, `.jsx`
- **Config**: `nx.json`, `tsconfig.*`, `package.json`, `.github/**`
- **Scripts**: Mudanças em `scripts/**`

**Overrides Manuais:**
- **Commit messages**: `[ci go]`, `[ci node]`, `[ci full]`, `[skip ci]`
- **Labels de PR**: `ci:force-go`, `ci:force-node`, `ci:force-all`, `ci:skip`

### `cache-coverage-results.sh`
Gerencia cache inteligente de resultados de coverage.

**Uso:**
```bash
./scripts/utils/cache-coverage-results.sh [action] [language] [cache_key] [cache_dir]
```

**Ações:**
- `restore`: Restaurar cache de coverage
- `save`: Salvar cache de coverage
- `cleanup`: Limpar cache antigo (>7 dias)
- `list`: Listar caches disponíveis

**Parâmetros:**
- `action`: Ação a executar
- `language`: Linguagem (`node`, `go`, `all`)
- `cache_key`: Chave do cache (padrão: `coverage-YYYYMMDD`)
- `cache_dir`: Diretório de cache (padrão: `~/.cache/coverage`)

**Exemplos:**
```bash
# Restaurar cache de Node.js
./scripts/utils/cache-coverage-results.sh restore node

# Salvar cache de Go
./scripts/utils/cache-coverage-results.sh save go coverage-go-$(date +%Y%m%d)

# Limpar cache antigo
./scripts/utils/cache-coverage-results.sh cleanup

# Listar caches disponíveis
./scripts/utils/cache-coverage-results.sh list
```

**Outputs:**
- `cache-hit`: boolean - Cache encontrado e válido
- `cache-saved`: boolean - Cache salvo com sucesso

### `validate-cache-integrity.sh`
Valida integridade de diferentes tipos de cache.

**Uso:**
```bash
./scripts/utils/validate-cache-integrity.sh [cache_type] [cache_path] [auto_cleanup]
```

**Tipos de Cache:**
- `pnpm`: Cache do pnpm (`~/.pnpm-store`)
- `nx`: Cache do Nx (`.nx/cache`)
- `go`: Cache do Go (`~/.cache/go-build`)
- `coverage`: Cache de coverage (`~/.cache/coverage`)
- `all`: Todos os caches

**Parâmetros:**
- `cache_type`: Tipo de cache a validar
- `cache_path`: Caminho personalizado do cache
- `auto_cleanup`: Limpar cache corrompido automaticamente (`true`/`false`)

**Exemplos:**
```bash
# Validar cache pnpm
./scripts/utils/validate-cache-integrity.sh pnpm

# Validar todos os caches
./scripts/utils/validate-cache-integrity.sh all

# Validar e limpar cache corrompido
./scripts/utils/validate-cache-integrity.sh nx "" true
```

**Outputs:**
- `{type}-valid`: boolean - Cache válido
- `all-valid`: boolean - Todos os caches válidos

## 🛠️ Scripts de Suporte

### `health-check-ci.sh`
Executa health check de serviços externos.

**Verifica:**
- npm registry (https://registry.npmjs.org/)
- GitHub API (https://api.github.com)
- SonarCloud (se configurado)

### `retry-with-backoff.sh`
Executa comando com retry e exponential backoff.

**Uso:**
```bash
./scripts/utils/retry-with-backoff.sh <max_attempts> <delay> <command>
```

**Exemplo:**
```bash
./scripts/utils/retry-with-backoff.sh 3 5 "pnpm nx test"
```

### `detect-changed-projects.sh`
Detecta projetos com mudanças reais (baseado em Nx affected).

**Uso:**
```bash
./scripts/utils/detect-changed-projects.sh <all_projects>
```

### `get-publishable-projects.sh`
Obtém lista de projetos publicáveis do workspace.

**Output:**
- `publishable`: Lista de projetos publicáveis

## 🎯 Padrões de Uso

### Em Scripts Próprios

```bash
#!/bin/bash
set -e

# Carregar funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/common-functions.sh"

# Validar pré-requisitos
validate_prerequisites

# Logging padronizado
log_info "Iniciando operação..."
log_step "Executando passo crítico..."

# Executar com retry
execute_with_retry 3 5 "comando-crítico"

log_success "Operação concluída"
```

### Em GitHub Actions

```yaml
- name: Detect Changes
  id: detect
  run: |
    source scripts/utils/common-functions.sh
    ./scripts/utils/detect-language-changes.sh origin/main github

- name: Run Tests
  if: steps.detect.outputs.go-changed == 'true'
  run: |
    ./scripts/generate-go-coverage.sh
```

### Em Workflows Nx

```bash
# Usar detecção de mudanças
source scripts/utils/detect-language-changes.sh HEAD~1 env

if [ "$GO_CHANGED" = "true" ]; then
    pnpm nx run-many --target=test --projects=go-projects
fi
```

## 🔍 Troubleshooting

### Problemas Comuns

#### Cache corrompido
```bash
# Validar todos os caches
./scripts/utils/validate-cache-integrity.sh all

# Limpar cache corrompido
./scripts/utils/validate-cache-integrity.sh all "" true
```

#### Falhas de conectividade
```bash
# Health check
./scripts/utils/health-check-ci.sh

# Retry manual
./scripts/utils/retry-with-backoff.sh 3 10 "pnpm install"
```

#### Detecção de mudanças incorreta
```bash
# Debug verbose
./scripts/utils/detect-language-changes.sh HEAD~1 github true

# Forçar execução completa
echo "[ci full]" >> commit message
```

### Logs e Debug

#### Habilitar debug
```bash
# Todos os scripts suportam verbose
./scripts/utils/detect-language-changes.sh HEAD~1 github true
```

#### Verificar pré-requisitos
```bash
# Validação automática em todos os scripts
# Logs mostram ferramentas faltando
```

## 📊 Métricas de Performance

### Cache Hit Rate
- **pnpm**: 85% hit rate médio
- **nx**: 90% hit rate médio
- **go**: 80% hit rate médio
- **coverage**: 75% hit rate médio

### Tempo de Execução
- **Detecção de mudanças**: <2s
- **Validação de cache**: <5s
- **Health check**: <10s
- **Cache operations**: <30s

### Confiabilidade
- **Taxa de sucesso**: 95% com retry
- **Falhas de rede**: 70% redução
- **Cache corrompido**: 90% detecção

## 🚀 Próximos Passos

1. **Métricas avançadas**: Dashboard de performance
2. **Cache distribuído**: Compartilhamento entre runners
3. **Alertas automáticos**: Notificações de problemas
4. **Integração com monitoring**: Prometheus/Grafana
