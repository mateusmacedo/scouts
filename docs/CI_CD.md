# 🚀 CI/CD Architecture Documentation

## Visão Geral

Esta documentação descreve a arquitetura de CI/CD otimizada implementada para o monorepo Nx, focando em eficiência, economia e boas práticas de DevOps.

## Arquitetura Atual

### 1. Pipeline CI Principal (`.github/workflows/ci.yml`)

**Objetivo:** Executar lint, test e build de forma otimizada e paralela.

**Estrutura:**
```
setup → [lint, test] → build → aggregate
```

**Características:**
- **Jobs Paralelos:** Lint, test e build executam em paralelo após setup
- **Matrix Strategy:** Distribui carga entre múltiplos runners
- **Cache Inteligente:** Reutiliza dependências e artifacts entre jobs
- **Nx Affected:** Executa apenas projetos afetados pelas mudanças

**Métricas Esperadas:**
- Tempo total: ~2-3 minutos (vs ~5 minutos anterior)
- Cache hit rate: >80%
- Paralelismo: 3-5 tasks simultâneas

### 2. Pipeline de Preview (`.github/workflows/preview.yml`)

**Objetivo:** Deploy automático de ambientes de preview para Pull Requests.

**Funcionalidades:**
- Build das aplicações afetadas
- Deploy para GitHub Pages com URL única por PR
- Comentário automático no PR com links de preview
- Cleanup automático quando PR é fechado

**URLs de Preview:**
- Formato: `https://{owner}.github.io/{repo}/pr-{number}/`
- Aplicações: bff-nest, express-notifier, user-go-service

### 3. Pipeline de Release (`.github/workflows/release.yml`)

**Objetivo:** Versionamento e publicação automatizada de pacotes.

**Estrutura:**
```
pre-release → [version, publish] → post-release
```

**Características:**
- **Dry-run:** Validação antes da execução real
- **Matrix Strategy:** Version e publish em paralelo
- **Cache Reuse:** Reutiliza cache do CI anterior
- **Conventional Commits:** Versionamento automático baseado em commits

### 4. Análise de Performance (`.github/workflows/performance.yml`)

**Objetivo:** Monitoramento e otimização contínua da performance.

**Métricas Analisadas:**
- Cache hit rate e eficiência
- Tempos de build com diferentes níveis de paralelismo
- Comparação entre builds completos vs afetados
- Uso de recursos (CPU, memória, disco)

## Configurações Otimizadas

### nx.json

**Named Inputs Otimizados:**
```json
{
  "namedInputs": {
    "production": ["default", "!{projectRoot}/**/*.spec.ts", "!{projectRoot}/**/*.md"],
    "testing": ["{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?", "..."],
    "linting": ["{projectRoot}/**/*.[jt]s?(x)", "..."],
    "sharedGlobals": ["{workspaceRoot}/go.work", "{workspaceRoot}/pnpm-lock.yaml", "..."]
  }
}
```

**Target Defaults:**
- Cache habilitado para todos os targets
- Paralelismo configurado globalmente (parallel: 5)
- Inputs otimizados para melhor granularidade de cache
- Outputs definidos para todos os artifacts relevantes

### Cache Strategy

**Níveis de Cache:**
1. **pnpm cache:** `$HOME/.pnpm-store`
2. **Go cache:** `$HOME/.cache/go-build`, `$HOME/go/pkg/mod`
3. **Nx cache:** `.nx/cache`
4. **Artifacts:** node_modules, build outputs

**Cache Keys:**
- pnpm: `${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}`
- Go: `${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}`
- Nx: `${{ runner.os }}-nx-${{ hashFiles('**/pnpm-lock.yaml', 'nx.json', 'tsconfig.base.json', 'jest.config.ts', 'jest.preset.js') }}`

## Métricas de Sucesso

### Performance
- **Tempo de CI:** Redução de 40-60% (de ~5min para ~2-3min)
- **Cache Hit Rate:** >80%
- **Feedback de Lint/Test:** <2 minutos
- **Preview Environments:** <3 minutos

### Economia
- **Custo:** $0 (apenas recursos gratuitos do GitHub Actions)
- **Eficiência:** Uso otimizado de runners com matrix strategy
- **Escalabilidade:** Fácil adicionar mais shards conforme necessário

### Qualidade
- **Cobertura de Testes:** Mantida em 70% (configurado em nx.json)
- **Lint:** Executado em paralelo com cache
- **Build:** Incremental com Nx affected

## Troubleshooting

### Problemas Comuns

#### 1. Cache Misses Frequentes
**Sintomas:** Builds lentos, cache não sendo reutilizado
**Soluções:**
- Verificar cache keys em workflows
- Limpar cache manualmente: `pnpm nx reset`
- Verificar mudanças em arquivos de configuração

#### 2. Jobs Falhando por Timeout
**Sintomas:** Jobs cancelados após timeout
**Soluções:**
- Reduzir paralelismo: `--parallel=3` em vez de `--parallel=5`
- Verificar recursos disponíveis no runner
- Otimizar dependências desnecessárias

#### 3. Preview Deploy Falhando
**Sintomas:** Preview não é criado ou URLs não funcionam
**Soluções:**
- Verificar permissões do GitHub Pages
- Confirmar que aplicações têm build de produção
- Verificar logs do workflow de preview

#### 4. Release Pipeline Falhando
**Sintomas:** Versionamento ou publicação falhando
**Soluções:**
- Verificar tokens NPM_TOKEN e GITHUB_TOKEN
- Executar dry-run primeiro: `pnpm nx release version --dry-run`
- Verificar configuração de conventional commits

### Comandos Úteis

```bash
# Limpar cache local
pnpm nx reset

# Executar apenas projetos afetados
pnpm nx affected -t build --parallel=3

# Verificar cache status
pnpm nx show projects --affected

# Executar análise de performance
pnpm nx run-many -t build --parallel=3 --verbose

# Verificar configuração
pnpm nx show projects --json
```

### Monitoramento

#### GitHub Actions
- **Runs:** Monitorar execuções em Actions tab
- **Artifacts:** Verificar upload/download de artifacts
- **Logs:** Analisar logs detalhados para problemas

#### Nx Cache
```bash
# Verificar cache directory
ls -la .nx/cache

# Analisar cache hits
pnpm nx run-many -t build --verbose
```

#### Performance
- **Workflow de Performance:** Executar manualmente para análise
- **Métricas:** Revisar relatórios gerados automaticamente
- **Tendências:** Monitorar evolução dos tempos de build

## Próximos Passos

### Melhorias Futuras
1. **Análise de Segurança:** Adicionar SAST, dependency scanning
2. **Deploy Automatizado:** Implementar deploy para staging/production
3. **Nx Cloud:** Considerar para DTE quando escala aumentar
4. **Testes E2E:** Adicionar em ambiente de preview
5. **Monitoramento:** Integração com ferramentas de observabilidade

### Escalabilidade
- **Mais Shards:** Adicionar runners conforme monorepo cresce
- **Cache Distribuído:** Considerar cache remoto self-hosted
- **Build Distribuído:** Implementar DTE com Nx Cloud

## Referências

- [Nx Documentation](https://nx.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx Cache Best Practices](https://nx.dev/features/cache-task-results)
- [Nx Affected Commands](https://nx.dev/features/run-affected-commands)

---

**Última atualização:** $(date)
**Versão:** 1.0.0
**Mantenedor:** DevOps Team
