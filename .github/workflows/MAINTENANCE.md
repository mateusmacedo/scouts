# Guia de Manutenção - Workflows GitHub Actions

## Visão Geral

Este documento fornece diretrizes para manutenção contínua dos workflows GitHub Actions otimizados, incluindo monitoramento de performance, atualizações de dependências e troubleshooting.

**Última atualização:** $(date)  
**Versão dos workflows:** Otimizada com Nx best practices

## Checklist de Manutenção

### Mensal (Recomendado)

#### 1. Validação de Performance
```bash
# Executar validação completa
./.github/scripts/validate-workflows-simple.sh

# Verificar relatório
cat .github/workflows/VALIDATION_RESULTS.md
```

#### 2. Análise de Métricas
```bash
# Analisar performance dos workflows
./.github/scripts/analyze-workflow-performance.sh

# Verificar relatório de análise
cat .github/workflows/PERFORMANCE_ANALYSIS.md
```

#### 3. Verificação de Cache
- **Nx cache hit rate:** > 80%
- **pnpm cache hit rate:** > 90%
- **Go cache hit rate:** > 90%

#### 4. Monitoramento de Tempo
- **CI workflow:** < 6min (target)
- **Release workflow:** < 8min (target)
- **Release validation:** < 4min (target)

### Trimestral (Recomendado)

#### 1. Atualização de Actions
```bash
# Verificar versões mais recentes
gh api repos/$GITHUB_REPOSITORY/actions/workflows --jq '.workflows[].path'

# Atualizar actions conforme necessário
```

#### 2. Revisão de Dependências
- **Node.js:** Verificar versão LTS mais recente
- **pnpm:** Verificar versão mais recente
- **Go:** Verificar versão mais recente
- **Nx:** Verificar versão mais recente

#### 3. Análise de Custos
- **Minutos de runner:** Monitorar tendência
- **Cache efficiency:** Verificar hit rates
- **Resource utilization:** Analisar uso de CPU/memória

## Monitoramento de Performance

### KPIs Primários

| Métrica | Baseline | Target | Status |
|---------|----------|--------|--------|
| **Tempo total CI** | 8-15min | < 6min | ⏳ |
| **Cache hit rate** | 0% | > 80% | ⏳ |
| **Projetos afetados accuracy** | 100% | 100% | ✅ |
| **Nx affected refs** | ❌ | ✅ | ✅ |
| **Paralelização** | ❌ | ✅ | ✅ |

### KPIs Secundários

| Métrica | Baseline | Target | Status |
|---------|----------|--------|--------|
| **Actions atualizadas** | ❌ | ✅ | ✅ |
| **Permissions explícitas** | ❌ | ✅ | ✅ |
| **Concurrency groups** | ❌ | ✅ | ✅ |
| **Nx cache persistence** | ❌ | ✅ | ✅ |

## Processo de Atualização

### 1. Atualização de Actions

#### Verificar Versões Disponíveis
```bash
# Verificar versões mais recentes
gh api repos/$GITHUB_REPOSITORY/actions/workflows --jq '.workflows[].path'
```

#### Atualizar Actions
```yaml
# Antes
- uses: actions/checkout@v4
- uses: actions/setup-node@v4

# Depois
- uses: actions/checkout@v5
- uses: actions/setup-node@v5
```

#### Testar Atualizações
```bash
# Executar validação
./.github/scripts/validate-workflows-simple.sh

# Verificar se não há regressões
```

### 2. Atualização de Dependências

#### Node.js
```yaml
# Verificar versão LTS mais recente
node-version: "20"  # Atualizar conforme necessário
```

#### pnpm
```yaml
# Verificar versão mais recente
version: 9.15.0  # Atualizar conforme necessário
```

#### Go
```yaml
# Verificar versão mais recente
go-version: "1.23"  # Atualizar conforme necessário
```

#### Nx
```bash
# Atualizar Nx
npm install -g nx@latest

# Verificar compatibilidade
nx report
```

### 3. Atualização de Configurações

#### Nx Configuration
```json
// nx.json - Verificar configurações
{
  "cacheDirectory": ".nx/cache",
  "namedInputs": { ... },
  "targetDefaults": { ... }
}
```

#### Cache Keys
```yaml
# Verificar se cache keys estão otimizados
key: ${{ runner.os }}-nx-${{ hashFiles('**/pnpm-lock.yaml', 'nx.json', 'tsconfig.base.json') }}
```

## Troubleshooting

### Problemas Comuns

#### 1. Cache Miss Rate Alto
**Sintomas:** Cache hit rate < 80%

**Diagnóstico:**
```bash
# Verificar cache keys
grep -r "key:" .github/workflows/

# Verificar arquivos de hash
ls -la pnpm-lock.yaml nx.json tsconfig.base.json
```

**Solução:**
- Verificar se arquivos de hash existem
- Ajustar cache keys se necessário
- Verificar restore-keys

#### 2. Nx Affected Processando Projetos Desnecessários
**Sintomas:** Muitos projetos processados em PRs

**Diagnóstico:**
```bash
# Verificar base/head refs
grep -r "nx affected" .github/workflows/
```

**Solução:**
- Verificar se base/head refs estão corretos
- Verificar se fetch-depth: 0 está configurado
- Verificar se branch está correto

#### 3. Workflow Falhando
**Sintomas:** Workflow falha com erro

**Diagnóstico:**
```bash
# Verificar logs do workflow
gh run list --workflow=CI
gh run view <run-id> --log
```

**Solução:**
- Verificar se secrets estão configurados
- Verificar se permissions estão corretas
- Verificar se dependências estão instaladas

#### 4. Performance Degradada
**Sintomas:** Tempo de execução > target

**Diagnóstico:**
```bash
# Analisar performance
./.github/scripts/analyze-workflow-performance.sh
```

**Solução:**
- Verificar cache hit rates
- Verificar paralelização
- Verificar se otimizações estão ativas

### Logs e Debug

#### 1. Habilitar Debug
```yaml
# Adicionar ao workflow
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

#### 2. Verificar Logs
```bash
# Logs do GitHub CLI
gh run view <run-id> --log

# Logs do Nx
nx report
```

#### 3. Verificar Configuração
```bash
# Verificar nx.json
cat nx.json

# Verificar workflows
ls -la .github/workflows/
```

## Scripts de Manutenção

### 1. Validação Automática
```bash
#!/bin/bash
# Script de validação automática
./.github/scripts/validate-workflows-simple.sh
```

### 2. Análise de Performance
```bash
#!/bin/bash
# Script de análise de performance
./.github/scripts/analyze-workflow-performance.sh
```

### 3. Simulação Local
```bash
#!/bin/bash
# Script de simulação local
./.github/scripts/simulate-ci.sh
```

## Alertas e Notificações

### 1. Configurar Alertas
```yaml
# Adicionar ao workflow
- name: Notify on failure
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      // Enviar notificação de falha
```

### 2. Monitoramento de Métricas
```yaml
# Adicionar step de monitoramento
- name: Monitor performance
  run: |
    echo "Workflow completed in ${{ github.run_duration }}"
    echo "Cache hit rate: ${{ steps.cache.outputs.cache-hit }}"
```

## Backup e Recuperação

### 1. Backup de Configurações
```bash
# Backup dos workflows
cp -r .github/workflows/ backup/workflows-$(date +%Y%m%d)/

# Backup do nx.json
cp nx.json backup/nx-$(date +%Y%m%d).json
```

### 2. Recuperação
```bash
# Restaurar workflows
cp -r backup/workflows-YYYYMMDD/ .github/workflows/

# Restaurar nx.json
cp backup/nx-YYYYMMDD.json nx.json
```

## Contato e Suporte

### 1. Documentação
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx Documentation](https://nx.dev)
- [pnpm Documentation](https://pnpm.io)

### 2. Comunidade
- [GitHub Actions Community](https://github.com/actions)
- [Nx Community](https://nx.dev/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/github-actions)

### 3. Issues
- Abrir issue no repositório
- Incluir logs de erro
- Incluir configuração atual

---

**Nota:** Este guia deve ser atualizado conforme novas otimizações são implementadas e novas práticas são descobertas.
