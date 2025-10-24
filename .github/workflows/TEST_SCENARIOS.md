# Matriz de Casos de Teste - Workflows GitHub Actions

## Visão Geral

Esta matriz documenta todos os cenários de teste necessários para validar o funcionamento completo dos workflows GitHub Actions com Nx, cobrindo diferentes tipos de mudanças, triggers e condições de execução.

## Cenários de Teste por Workflow

### 1. CI Workflow (ci.yml)

#### 1.1 Push para main/develop
**Trigger:** `push` para branches main ou develop

| Cenário | Descrição | Projetos Afetados | Comando Nx | Resultado Esperado |
|---------|-----------|-------------------|------------|-------------------|
| **C1.1** | Mudança em lib compartilhada (logger-node) | 3 apps (bff-nest, express-notifier, user-go-service) | `nx affected -t lint test build` | Todos os 3 apps processados |
| **C1.2** | Mudança em app isolado (user-go-service) | 1 app (user-go-service) | `nx affected -t lint test build` | Apenas 1 app processado |
| **C1.3** | Mudança em arquivo root (nx.json) | Todos os projetos | `nx affected -t lint test build` | Todos os projetos processados |
| **C1.4** | Mudança em lib específica (utils-nest) | 1 app (bff-nest) | `nx affected -t lint test build` | Apenas bff-nest processado |

#### 1.2 Pull Request
**Trigger:** `pull_request` para qualquer branch

| Cenário | Descrição | Base/Head | Projetos Afetados | Resultado Esperado |
|---------|-----------|-----------|-------------------|-------------------|
| **C2.1** | PR com mudança em lib compartilhada | origin/main → feature/lib-change | 3 apps | Todos os 3 apps processados |
| **C2.2** | PR com mudança em app isolado | origin/main → feature/app-change | 1 app | Apenas 1 app processado |
| **C2.3** | PR com mudança em config global | origin/main → feature/config-change | Todos | Todos os projetos processados |
| **C2.4** | PR sem mudanças em código | origin/main → feature/docs | Nenhum | Nenhum projeto processado |

### 2. Release Workflow (release.yml)

#### 2.1 Push para main
**Trigger:** `push` para branch main

| Cenário | Descrição | Condição | Resultado Esperado |
|---------|-----------|----------|-------------------|
| **R1.1** | Push normal para main | `!contains(github.event.head_commit.message, 'chore(release):')` | Workflow executa |
| **R1.2** | Push de commit de release | `contains(github.event.head_commit.message, 'chore(release):')` | Workflow skipado |
| **R1.3** | Push para main com conventional commits | Commit com feat/fix/breaking | Versioning automático |

#### 2.2 Workflow Dispatch Manual
**Trigger:** `workflow_dispatch`

| Cenário | Descrição | Input | Resultado Esperado |
|---------|-----------|-------|-------------------|
| **R2.1** | Release manual sem version specifier | `version-specifier: ""` | Usa conventional commits |
| **R2.2** | Release manual com version specifier | `version-specifier: "1.2.3"` | Usa versão especificada |

### 3. Release Validation Workflow (release-validation.yml)

#### 3.1 Pull Request para main
**Trigger:** `pull_request` para branch main

| Cenário | Descrição | Resultado Esperado |
|---------|-----------|-------------------|
| **V1.1** | PR com conventional commits | Dry-run executa com sucesso |
| **V1.2** | PR sem conventional commits | Dry-run executa (sem version bump) |
| **V1.3** | PR com breaking changes | Dry-run detecta major version bump |

## Cenários de Cache

### 4. Cache Hit/Miss Scenarios

| Cenário | Descrição | Cache Type | Resultado Esperado |
|---------|-----------|------------|-------------------|
| **CH1** | Primeira execução (cold start) | pnpm, Go, Nx | Cache miss em todos |
| **CH2** | Segunda execução (mesmo commit) | pnpm, Go, Nx | Cache hit em todos |
| **CH3** | Execução após mudança em pnpm-lock.yaml | pnpm | Cache miss pnpm, hit Go/Nx |
| **CH4** | Execução após mudança em go.sum | Go | Cache miss Go, hit pnpm/Nx |
| **CH5** | Execução após mudança em nx.json | Nx | Cache miss Nx, hit pnpm/Go |

## Cenários de Erro

### 5. Error Scenarios

| Cenário | Descrição | Trigger | Resultado Esperado |
|---------|-----------|---------|-------------------|
| **E1** | Falha de lint | Qualquer | Workflow falha, não executa test/build |
| **E2** | Falha de test | Qualquer | Workflow falha, não executa build |
| **E3** | Falha de build | Qualquer | Workflow falha |
| **E4** | Secret ausente (NPM_TOKEN) | release.yml | Workflow falha na publicação |
| **E5** | Nx affected sem base válido | PR | Workflow processa todos os projetos |

## Cenários de Performance

### 6. Performance Scenarios

| Cenário | Descrição | Métricas | Resultado Esperado |
|---------|-----------|----------|-------------------|
| **P1** | Execução com cache hit | Tempo total < 5min | Performance otimizada |
| **P2** | Execução com cache miss | Tempo total 8-15min | Performance baseline |
| **P3** | Múltiplos projetos afetados | Paralelização ativa | Tempo proporcional |
| **P4** | Apenas 1 projeto afetado | Execução sequencial | Tempo mínimo |

## Cenários de Otimização

### 7. Optimization Scenarios

| Cenário | Descrição | Configuração | Benefício Esperado |
|---------|-----------|--------------|-------------------|
| **O1** | Nx affected com base/head corretos | `--base=origin/main --head=$GITHUB_HEAD_REF` | 10-30% redução em projetos processados |
| **O2** | Nx cache persistido | Cache de `.nx/cache` | 50-80% redução em tasks repetidas |
| **O3** | Paralelização ativa | `--parallel=3` | 20-40% redução em tempo total |
| **O4** | Actions atualizadas | v5 para checkout/setup-node | Melhor performance e segurança |

## Matriz de Execução

### 8. Plano de Execução dos Testes

#### Fase 1: Preparação
1. **Criar branch de teste:** `test/workflow-validation`
2. **Preparar commits isolados:**
   - Commit 1: Mudança em `libs/logger-node` (C1.1)
   - Commit 2: Mudança em `apps/user-go-service` (C1.2)
   - Commit 3: Mudança em `nx.json` (C1.3)
   - Commit 4: Mudança em `libs/utils-nest` (C1.4)

#### Fase 2: Execução Sequencial
1. **Push Commit 1** → Executar CI (C1.1)
2. **Push Commit 2** → Executar CI (C1.2)
3. **Push Commit 3** → Executar CI (C1.3)
4. **Push Commit 4** → Executar CI (C1.4)
5. **Criar PR** → Executar CI + Release Validation (C2.1 + V1.1)
6. **Merge PR** → Executar Release (R1.1)

#### Fase 3: Coleta de Métricas
Para cada execução, registrar:
- **Tempo total** do workflow
- **Tempo por step** (checkout, setup, cache, install, nx affected)
- **Cache hit/miss** para pnpm, Go, Nx
- **Projetos afetados** vs total disponível
- **Minutos de runner** consumidos

#### Fase 4: Análise de Bottlenecks
- Identificar steps > 30s
- Calcular cache hit rate
- Verificar paralelização efetiva
- Validar Nx affected accuracy

## Critérios de Sucesso

### 9. Critérios de Validação

| Métrica | Baseline | Target | Status |
|---------|----------|--------|--------|
| **Tempo total CI** | 8-15min | < 6min | ⏳ |
| **Cache hit rate** | 0% | > 80% | ⏳ |
| **Projetos afetados accuracy** | 100% | 100% | ⏳ |
| **Nx affected refs** | ❌ | ✅ | ⏳ |
| **Paralelização** | ❌ | ✅ | ⏳ |
| **Actions atualizadas** | ❌ | ✅ | ⏳ |

## Próximos Passos

1. **Implementar branch de teste** com commits isolados
2. **Executar matriz completa** de cenários
3. **Coletar métricas detalhadas** de performance
4. **Identificar bottlenecks** específicos
5. **Aplicar otimizações** baseadas nos resultados
6. **Re-executar testes** para validar melhorias

---

**Nota:** Esta matriz deve ser executada antes e depois das otimizações para validar o impacto quantitativo das melhorias implementadas.
