# 🚨 Guia Completo de Flaky Tasks

## Visão Geral

Este guia fornece uma abordagem abrangente para detectar, analisar e resolver **flaky tasks** (tarefas intermitentes) no pipeline CI/CD. Flaky tasks são execuções que falham de forma inconsistente, causando falsos positivos e reduzindo a confiabilidade do pipeline.

## 📋 Índice

1. [O que são Flaky Tasks](#o-que-são-flaky-tasks)
2. [Causas Comuns](#causas-comuns)
3. [Detecção e Análise](#detecção-e-análise)
4. [Estratégias de Mitigação](#estratégias-de-mitigação)
5. [Configuração de Retry](#configuração-de-retry)
6. [Monitoramento e Alertas](#monitoramento-e-alertas)
7. [Boas Práticas](#boas-práticas)
8. [Ferramentas e Scripts](#ferramentas-e-scripts)
9. [Casos de Uso](#casos-de-uso)
10. [Troubleshooting](#troubleshooting)

## O que são Flaky Tasks

### Definição

**Flaky tasks** são tarefas que apresentam falhas intermitentes, ou seja:
- Falham em algumas execuções e passam em outras
- Apresentam taxa de falha entre 5% e 95%
- Não possuem causa raiz clara e consistente
- Podem ser influenciadas por timing, recursos ou dependências externas

### Impacto

- **Falsos positivos**: Desenvolvedores perdem tempo investigando falhas inexistentes
- **Redução de confiança**: Equipe perde confiança no pipeline
- **Atraso no desenvolvimento**: PRs ficam bloqueados por falhas intermitentes
- **Custo computacional**: Retries desnecessários consomem recursos

## Causas Comuns

### 1. Dependências Externas

```bash
# ❌ Problema: Dependência externa instável
curl -s https://api.external-service.com/data

# ✅ Solução: Timeout e retry
curl -s --connect-timeout 10 --max-time 30 https://api.external-service.com/data
```

### 2. Race Conditions

```typescript
// ❌ Problema: Race condition em testes
describe('User Service', () => {
  it('should create user', async () => {
    const user = await userService.create({ name: 'Test' });
    expect(user.id).toBeDefined();
  });
});

// ✅ Solução: Isolamento adequado
describe('User Service', () => {
  beforeEach(async () => {
    await database.clean();
    await database.seed();
  });

  it('should create user', async () => {
    const user = await userService.create({ name: 'Test' });
    expect(user.id).toBeDefined();
  });
});
```

### 3. Timeouts Inadequados

```yaml
# ❌ Problema: Timeout muito baixo
- name: Run Tests
  run: npm test
  timeout-minutes: 5

# ✅ Solução: Timeout apropriado
- name: Run Tests
  run: npm test
  timeout-minutes: 15
```

### 4. Recursos Compartilhados

```bash
# ❌ Problema: Porta compartilhada
npm start --port 3000

# ✅ Solução: Porta dinâmica
npm start --port $((3000 + RANDOM % 1000))
```

## Detecção e Análise

### Script de Detecção

```bash
# Executar detecção de flaky tasks
./scripts/utils/detect-flaky-tasks.sh \
  --threshold=5 \
  --days=30 \
  --output=json \
  --verbose
```

### Parâmetros de Configuração

- `--threshold`: Taxa de falha mínima para considerar flaky (padrão: 5%)
- `--days`: Período de análise em dias (padrão: 30)
- `--output`: Formato de saída (json, text, github)
- `--verbose`: Saída detalhada

### Análise de Tendências

```bash
# Coletar métricas históricas
./scripts/utils/flaky-tasks-metrics.sh \
  --period=30d \
  --output=html
```

## Estratégias de Mitigação

### 1. Retry Inteligente

```bash
# Função de retry com exponential backoff
execute_with_retry() {
  local max_attempts=${1:-3}
  local base_delay=${2:-5}
  local jitter_max=${3:-2}
  local retryable_patterns=${4:-"ECONNRESET|ETIMEDOUT|ENOTFOUND"}
  
  # Implementação com jitter e backoff
  # ...
}
```

### 2. Circuit Breaker

```bash
# Implementar circuit breaker para evitar cascata de falhas
execute_with_circuit_breaker() {
  local max_failures=${1:-5}
  local reset_timeout=${2:-300}
  
  # Verificar se circuit breaker está aberto
  # ...
}
```

### 3. Isolamento de Testes

```typescript
// Jest setup para isolamento
beforeEach(() => {
  // Limpar estado global
  jest.clearAllMocks();
  
  // Configurar mocks determinísticos
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  // Cleanup de recursos
  cleanupHandlers.forEach(handler => handler());
});
```

## Configuração de Retry

### Nx Configuration

```json
{
  "targetDefaults": {
    "test": {
      "retry": {
        "maxRetries": 3,
        "retryDelay": 3000,
        "retryableErrorPatterns": [
          "ECONNRESET",
          "ETIMEDOUT",
          "Test timeout",
          "Jest timeout"
        ]
      }
    }
  }
}
```

### Jest Configuration

```typescript
export default {
  testTimeout: 30000,
  retryTimes: 2,
  bail: false,
  maxWorkers: '50%',
  detectOpenHandles: true,
  detectLeaks: true,
  forceExit: true
};
```

### GitHub Actions

```yaml
- name: Run Tests with Retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 15
    max_attempts: 3
    retry_wait_seconds: 30
    command: pnpm nx test
```

## Monitoramento e Alertas

### Workflow de Análise Semanal

```yaml
name: Flaky Tasks Analysis
on:
  schedule:
    - cron: '0 9 * * 1'  # Toda segunda-feira às 9:00 UTC
```

### Métricas Importantes

- **Taxa de falha por task**: Identificar tasks problemáticas
- **Tendências temporais**: Detectar degradação de performance
- **Tempo de execução**: Monitorar regressões de performance
- **Padrões de falha**: Identificar causas comuns

### Alertas Automáticos

```bash
# Configurar alertas para taxa de falha > 10%
if [ "$failure_rate" -gt 10 ]; then
  send_alert "High failure rate detected: ${failure_rate}%"
fi
```

## Boas Práticas

### 1. Isolamento de Testes

```typescript
// ✅ Bom: Teste isolado
describe('User Service', () => {
  beforeEach(() => {
    // Setup específico para cada teste
    userService = new UserService(mockDatabase);
  });
  
  it('should create user', async () => {
    // Teste determinístico
    const user = await userService.create({ name: 'Test' });
    expect(user.id).toBeDefined();
  });
});
```

### 2. Mocks Determinísticos

```typescript
// ✅ Bom: Mock determinístico
jest.spyOn(Math, 'random').mockReturnValue(0.5);
jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
```

### 3. Timeouts Apropriados

```yaml
# ✅ Bom: Timeout baseado no tipo de task
- name: Unit Tests
  timeout-minutes: 10
  
- name: Integration Tests
  timeout-minutes: 30
  
- name: E2E Tests
  timeout-minutes: 60
```

### 4. Cleanup de Recursos

```typescript
// ✅ Bom: Cleanup adequado
afterEach(() => {
  // Fechar conexões
  database.close();
  
  // Limpar arquivos temporários
  fs.rmSync(tempDir, { recursive: true });
  
  // Limpar timers
  jest.clearAllTimers();
});
```

## Ferramentas e Scripts

### Scripts Disponíveis

1. **`detect-flaky-tasks.sh`**: Detecção de tasks flaky
2. **`flaky-tasks-metrics.sh`**: Coleta de métricas
3. **`common-functions.sh`**: Funções de retry e circuit breaker

### Workflows GitHub Actions

1. **`ci-optimized.yml`**: Pipeline principal com retry
2. **`flaky-tasks-analysis.yml`**: Análise semanal automática

### Configurações

1. **`nx.json`**: Configuração de retry no Nx
2. **`jest.config.ts`**: Configuração de retry no Jest
3. **`jest.setup.ts`**: Setup para estabilidade

## Casos de Uso

### Caso 1: Teste de Integração Flaky

**Problema**: Teste de integração falha intermitentemente devido a dependência externa.

**Solução**:
```typescript
// Implementar retry específico para testes de integração
describe('Integration Tests', () => {
  it('should call external API', async () => {
    const result = await execute_with_retry(
      3, 5, 2, 
      "ECONNRESET|ETIMEDOUT",
      () => externalApi.call()
    );
    expect(result).toBeDefined();
  });
});
```

### Caso 2: Build Flaky

**Problema**: Build falha devido a problemas de rede ou recursos.

**Solução**:
```yaml
# Configurar retry no workflow
- name: Build with Retry
  run: |
    source scripts/utils/common-functions.sh
    execute_task_with_retry "build" 3 10 "pnpm nx build"
```

### Caso 3: Coverage Collection Flaky

**Problema**: Coleta de coverage falha devido a problemas de timing.

**Solução**:
```bash
# Implementar retry na coleta de coverage
execute_task_with_retry "coverage" 2 5 "./scripts/coverage-strategy.sh"
```

## Troubleshooting

### Problemas Comuns

1. **Retry excessivo**: Ajustar `maxRetries` e `retryDelay`
2. **Timeout muito baixo**: Aumentar timeout para tasks longas
3. **Recursos insuficientes**: Ajustar `maxWorkers` e recursos
4. **Dependências externas**: Implementar mocks ou stubs

### Debugging

```bash
# Executar com verbose para debugging
./scripts/utils/detect-flaky-tasks.sh --verbose

# Analisar logs de falha
grep -E "ECONNRESET|ETIMEDOUT|Timeout" ci.log

# Verificar métricas históricas
cat .nx/cache/flaky-tasks-metrics.json | jq '.history[-1]'
```

### Checklist de Verificação

- [ ] Tasks flaky identificadas e documentadas
- [ ] Retry configurado adequadamente
- [ ] Timeouts apropriados para cada tipo de task
- [ ] Isolamento de testes implementado
- [ ] Mocks determinísticos configurados
- [ ] Cleanup de recursos implementado
- [ ] Monitoramento e alertas configurados
- [ ] Documentação atualizada

## Métricas de Sucesso

### Objetivos Quantitativos

- **Redução de 70%** em falhas por flaky tasks
- **Taxa de sucesso > 95%** em todas as tasks
- **Tempo médio de retry < 30s**
- **Detecção de flaky tasks < 24h**
- **Resolução de flaky tasks < 7 dias**

### Objetivos Qualitativos

- Confiabilidade aumentada do CI/CD
- Redução de tempo investigando falsos positivos
- Melhoria na experiência de desenvolvimento
- Documentação completa e acessível

## Conclusão

A implementação de estratégias abrangentes para detectar e resolver flaky tasks é essencial para manter um pipeline CI/CD confiável e eficiente. Este guia fornece as ferramentas e práticas necessárias para:

1. **Detectar** tasks flaky automaticamente
2. **Analisar** padrões e tendências
3. **Mitigar** problemas com retry inteligente
4. **Monitorar** continuamente a saúde do pipeline
5. **Documentar** e compartilhar conhecimento

Lembre-se: **"Menos é mais"** - foque em correções específicas e eficazes, não em soluções complexas desnecessárias.
