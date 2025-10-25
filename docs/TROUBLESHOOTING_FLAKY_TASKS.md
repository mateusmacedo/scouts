# 🔧 Guia de Troubleshooting para Flaky Tasks

## Visão Geral

Este guia fornece um processo estruturado para investigar e resolver problemas relacionados a flaky tasks no pipeline CI/CD. Siga os passos em ordem para uma investigação eficiente.

## 📋 Índice

1. [Processo de Investigação](#processo-de-investigação)
2. [Ferramentas de Debug](#ferramentas-de-debug)
3. [Problemas Comuns e Soluções](#problemas-comuns-e-soluções)
4. [Checklist de Verificação](#checklist-de-verificação)
5. [Casos de Uso Específicos](#casos-de-uso-específicos)
6. [Escalação e Suporte](#escalação-e-suporte)

## Processo de Investigação

### Passo 1: Identificar o Problema

```bash
# 1. Executar detecção de flaky tasks
./scripts/utils/detect-flaky-tasks.sh --verbose

# 2. Verificar métricas históricas
./scripts/utils/flaky-tasks-metrics.sh --period=7d --output=text

# 3. Analisar logs de falha
grep -E "ERROR|FAIL|Timeout" .github/workflows/ci-optimized.yml
```

### Passo 2: Coletar Informações

```bash
# 1. Verificar status do pipeline
gh run list --limit 10

# 2. Analisar execução específica
gh run view <run-id> --log

# 3. Verificar recursos disponíveis
df -h
free -h
nproc
```

### Passo 3: Isolar a Causa

```bash
# 1. Executar task isoladamente
pnpm nx test <project-name> --verbose

# 2. Verificar dependências
pnpm list --depth=0

# 3. Testar conectividade
curl -I https://registry.npmjs.org/
```

### Passo 4: Implementar Solução

```bash
# 1. Aplicar retry específico
source scripts/utils/common-functions.sh
execute_task_with_retry "test" 3 5 "pnpm nx test <project-name>"

# 2. Ajustar configurações
# Editar nx.json, jest.config.ts, etc.

# 3. Testar solução
./scripts/utils/detect-flaky-tasks.sh --threshold=3 --days=3
```

## Ferramentas de Debug

### 1. Scripts de Análise

```bash
# Detecção de flaky tasks
./scripts/utils/detect-flaky-tasks.sh \
  --threshold=5 \
  --days=30 \
  --output=json \
  --verbose

# Coleta de métricas
./scripts/utils/flaky-tasks-metrics.sh \
  --period=30d \
  --output=html

# Análise de tendências
./scripts/utils/flaky-tasks-metrics.sh \
  --period=90d \
  --output=json | jq '.trends'
```

### 2. Logs e Debugging

```bash
# Habilitar debug no Jest
DEBUG=jest* pnpm nx test

# Logs detalhados do Nx
NX_VERBOSE_LOGGING=true pnpm nx test

# Debug de rede
curl -v --connect-timeout 10 https://api.github.com
```

### 3. Análise de Performance

```bash
# Verificar uso de recursos
htop
iotop
netstat -tulpn

# Análise de timing
time pnpm nx test
time pnpm nx build
```

## Problemas Comuns e Soluções

### 1. Timeout Issues

**Sintomas**:
- Falhas com "Timeout" ou "ETIMEDOUT"
- Tasks que passam localmente mas falham no CI

**Diagnóstico**:
```bash
# Verificar timeouts configurados
grep -r "timeout" .github/workflows/
grep -r "testTimeout" jest.config.ts
```

**Solução**:
```yaml
# Aumentar timeout no workflow
- name: Run Tests
  run: pnpm nx test
  timeout-minutes: 30
```

```typescript
// Ajustar timeout no Jest
export default {
  testTimeout: 60000, // 60 segundos
  // ...
};
```

### 2. Race Conditions

**Sintomas**:
- Testes que passam/falham aleatoriamente
- Falhas relacionadas a timing

**Diagnóstico**:
```bash
# Verificar isolamento de testes
grep -r "beforeEach\|afterEach" src/
grep -r "describe\|it" src/
```

**Solução**:
```typescript
// Implementar isolamento adequado
describe('User Service', () => {
  beforeEach(async () => {
    await database.clean();
    await database.seed();
  });

  afterEach(async () => {
    await database.clean();
  });
});
```

### 3. Dependências Externas

**Sintomas**:
- Falhas de rede (ECONNRESET, ETIMEDOUT)
- Dependências não disponíveis

**Diagnóstico**:
```bash
# Testar conectividade
curl -I https://registry.npmjs.org/
curl -I https://api.github.com

# Verificar DNS
nslookup registry.npmjs.org
```

**Solução**:
```bash
# Implementar retry com timeout
curl -s --connect-timeout 10 --max-time 30 \
  --retry 3 --retry-delay 5 \
  https://registry.npmjs.org/
```

### 4. Recursos Insuficientes

**Sintomas**:
- Falhas de memória (OOM)
- Tasks lentas ou travadas

**Diagnóstico**:
```bash
# Verificar recursos
free -h
df -h
nproc

# Verificar uso durante execução
htop
```

**Solução**:
```typescript
// Reduzir workers no Jest
export default {
  maxWorkers: '25%', // Usar apenas 25% dos cores
  // ...
};
```

### 5. Cache Issues

**Sintomas**:
- Falhas relacionadas a cache corrompido
- Comportamento inconsistente entre execuções

**Diagnóstico**:
```bash
# Verificar integridade do cache
./scripts/utils/validate-cache-integrity.sh

# Verificar tamanho do cache
du -sh .nx/cache/
du -sh node_modules/
```

**Solução**:
```bash
# Limpar cache corrompido
rm -rf .nx/cache/
rm -rf node_modules/
pnpm install
```

## Checklist de Verificação

### ✅ Pré-Investigação

- [ ] Task flaky identificada e documentada
- [ ] Logs de falha coletados
- [ ] Métricas históricas analisadas
- [ ] Padrão de falha identificado

### ✅ Investigação Técnica

- [ ] Causa raiz identificada
- [ ] Dependências verificadas
- [ ] Recursos disponíveis confirmados
- [ ] Configurações revisadas

### ✅ Implementação da Solução

- [ ] Solução implementada
- [ ] Testes de validação executados
- [ ] Configurações atualizadas
- [ ] Documentação atualizada

### ✅ Validação

- [ ] Task executada com sucesso
- [ ] Métricas melhoradas
- [ ] Monitoramento configurado
- [ ] Equipe notificada

## Casos de Uso Específicos

### Caso 1: Teste de Integração Flaky

**Problema**: Teste de integração falha 30% das vezes devido a API externa.

**Investigações**:
```bash
# 1. Verificar conectividade
curl -v https://api.external-service.com/health

# 2. Analisar logs de falha
grep -A 5 -B 5 "ECONNRESET\|ETIMEDOUT" test.log

# 3. Testar isoladamente
pnpm nx test integration-tests --verbose
```

**Soluções**:
```typescript
// 1. Implementar retry específico
describe('External API Integration', () => {
  it('should call external API', async () => {
    const result = await execute_with_retry(
      3, 5, 2,
      "ECONNRESET|ETIMEDOUT",
      () => externalApi.call()
    );
    expect(result).toBeDefined();
  });
});

// 2. Mock para desenvolvimento
if (process.env.NODE_ENV === 'test') {
  jest.mock('./external-api', () => ({
    call: jest.fn().mockResolvedValue({ data: 'mock' })
  }));
}
```

### Caso 2: Build Flaky

**Problema**: Build falha devido a problemas de rede durante instalação de dependências.

**Investigações**:
```bash
# 1. Verificar conectividade do registry
curl -I https://registry.npmjs.org/

# 2. Analisar logs de instalação
pnpm install --reporter=default

# 3. Verificar cache
pnpm store path
ls -la ~/.pnpm-store/
```

**Soluções**:
```yaml
# 1. Configurar retry no workflow
- name: Install Dependencies
  run: |
    source scripts/utils/common-functions.sh
    execute_with_retry 3 10 "pnpm install --frozen-lockfile"

# 2. Configurar registry alternativo
- name: Setup pnpm registry
  run: |
    pnpm config set registry https://registry.npmjs.org/
    pnpm config set network-timeout 60000
```

### Caso 3: Coverage Collection Flaky

**Problema**: Coleta de coverage falha devido a problemas de timing.

**Investigações**:
```bash
# 1. Verificar processo de coverage
ps aux | grep coverage

# 2. Analisar logs de coverage
grep -A 10 -B 10 "coverage" ci.log

# 3. Testar coleta isoladamente
./scripts/coverage-strategy.sh affected HEAD~1
```

**Soluções**:
```bash
# 1. Implementar retry na coleta
execute_task_with_retry "coverage" 2 5 "./scripts/coverage-strategy.sh"

# 2. Ajustar timeout
export JEST_TIMEOUT=60000

# 3. Configurar cleanup
trap 'pkill -f coverage' EXIT
```

## Escalação e Suporte

### Níveis de Escalação

#### Nível 1: Desenvolvedor
- Investigação inicial
- Aplicação de soluções simples
- Documentação do problema

#### Nível 2: Tech Lead
- Análise de padrões complexos
- Implementação de soluções avançadas
- Coordenação com equipe

#### Nível 3: DevOps/Infraestrutura
- Problemas de infraestrutura
- Configurações de CI/CD
- Recursos e performance

### Processo de Escalação

1. **Documentar o problema**:
   ```markdown
   ## Problema
   - Task: [nome da task]
   - Taxa de falha: [X]%
   - Período: [dias]
   - Sintomas: [descrição]
   
   ## Investigação realizada
   - [lista de ações]
   
   ## Soluções tentadas
   - [lista de tentativas]
   
   ## Próximos passos
   - [ações necessárias]
   ```

2. **Coletar evidências**:
   - Logs de falha
   - Métricas históricas
   - Screenshots ou capturas
   - Configurações relevantes

3. **Comunicar com stakeholders**:
   - Impacto no desenvolvimento
   - Tempo estimado para resolução
   - Recursos necessários

### Contatos de Suporte

- **Slack**: #devops-support
- **Email**: devops@company.com
- **Issues**: GitHub Issues com label `flaky-task`
- **Documentação**: [Link para wiki interno]

## Ferramentas de Monitoramento

### Dashboards

1. **GitHub Actions**: Monitor de execuções
2. **Métricas customizadas**: Scripts de análise
3. **Alertas**: Notificações automáticas

### Alertas Configurados

- Taxa de falha > 10%
- Tempo de execução > 2x normal
- Tasks flaky detectadas
- Recursos insuficientes

### Relatórios Automáticos

- Análise semanal de flaky tasks
- Relatório mensal de tendências
- Alertas em tempo real

## Conclusão

O troubleshooting de flaky tasks requer uma abordagem sistemática e metódica. Este guia fornece as ferramentas e processos necessários para:

1. **Identificar** problemas rapidamente
2. **Investigar** causas raiz eficientemente
3. **Implementar** soluções adequadas
4. **Validar** correções
5. **Documentar** lições aprendidas

Lembre-se: **"Prevenção é melhor que correção"** - implemente boas práticas desde o início para evitar flaky tasks.
