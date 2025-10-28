# Sprint 1: Correções Críticas - ProcessHandlerManager Tests

**Duração**: Dias 1-2 (8h total)  
**Prioridade**: P0 - CRÍTICA  
**Objetivo**: Implementar isolamento básico e garantir 100% de testes passando

## 1. Contexto e Objetivos

### 1.1 Problemas Identificados
- **Taxa de falha**: 23% (3/13 testes falhando)
- **Causa raiz**: Event listeners globais não isolados entre testes
- **Impacto**: Testes não validam comportamento real de sinais do processo

### 1.2 Objetivos do Sprint
- ✅ Implementar isolamento básico de event listeners
- ✅ Garantir 100% dos testes passando
- ✅ Eliminar flakiness em execuções consecutivas
- ✅ Manter compatibilidade com código de produção

## 2. Ações Críticas

### 2.1 Dia 1 (4h): Implementação de Métodos de Reset

**Ação 1.1**: Implementar método `resetForTesting()`

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.ts`

**Mudança**: Adicionar método estático público para reset completo do singleton

```typescript
/**
 * Resets the singleton instance for testing purposes.
 * Clears all event listeners, sinks, and internal state.
 * Should ONLY be used in test environments.
 */
static resetForTesting(): void {
  if (ProcessHandlerManager.instance) {
    ProcessHandlerManager.instance.cleanupListeners();
    ProcessHandlerManager.instance.sinks.clear();
    ProcessHandlerManager.instance.buffers.clear();
    ProcessHandlerManager.instance.isShuttingDown = false;
  }
  ProcessHandlerManager.instance = null;
}
```

**Ação 1.2**: Tornar método `setupProcessHandlers()` público

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.ts`

**Mudança**: Alterar visibilidade do método (linha 91)

```typescript
// De: private setupProcessHandlers()
// Para: public setupProcessHandlers()
public setupProcessHandlers(): void {
  // ... código existente ...
}
```

**Ação 1.3**: Adicionar cleanup no `afterEach` dos testes

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.spec.ts`

**Mudança**: Implementar cleanup completo após cada teste

```typescript
afterEach(() => {
  ProcessHandlerManager.resetForTesting();
  jest.restoreAllMocks();
});
```

### 2.2 Dia 2 (4h): Isolamento de Handlers Globais

**Ação 2.1**: Isolar handlers globais do Jest

**Arquivo**: `jest.setup.ts`

**Mudança**: Adicionar flag para desabilitar handlers em testes específicos

```typescript
// Adicionar no início do arquivo
declare global {
  var __DISABLE_GLOBAL_HANDLERS__: boolean;
}

// Modificar handlers existentes (linhas 81-87)
if (!global.__DISABLE_GLOBAL_HANDLERS__) {
  process.on('SIGTERM', () => {
    // ... código existente ...
  });
  
  process.on('SIGINT', () => {
    // ... código existente ...
  });
}
```

**Ação 2.2**: Criar setup específico para testes de ProcessHandlerManager

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.spec.ts`

**Mudança**: Adicionar `beforeAll` que desabilita handlers globais

```typescript
beforeAll(() => {
  // Desabilitar handlers globais do Jest
  global.__DISABLE_GLOBAL_HANDLERS__ = true;
});

afterAll(() => {
  // Reabilitar handlers globais
  global.__DISABLE_GLOBAL_HANDLERS__ = false;
});
```

## 3. Critérios de Aceitação

### 3.1 Critérios Técnicos
- ✅ 100% dos testes do `ProcessHandlerManager` passando (13/13)
- ✅ 0% de flakiness em 10 execuções consecutivas
- ✅ Tempo de execução <3s
- ✅ Isolamento completo entre testes

### 3.2 Critérios de Qualidade
- ✅ Cada teste pode ser executado isoladamente
- ✅ Ordem de execução não afeta resultados
- ✅ Sem vazamento de estado entre testes
- ✅ Compatibilidade com código de produção mantida

## 4. Validação e Testes

### 4.1 Script de Validação
```bash
# Executar testes 10x para validar estabilidade
for i in {1..10}; do
  echo "Execução $i/10"
  nx test logger-node --testPathPattern=process-handler.spec.ts
  if [ $? -ne 0 ]; then
    echo "Falha na execução $i"
    exit 1
  fi
done
echo "Todos os testes passaram em 10 execuções consecutivas"
```

### 4.2 Métricas de Sucesso
- **Taxa de sucesso**: 100% (13/13 testes)
- **Flakiness rate**: 0%
- **Tempo de execução**: <3s
- **Cobertura**: Manter ≥80% em `process-handler.ts`

## 5. Riscos e Mitigações

### 5.1 Riscos Identificados
- **Risco**: Quebra de compatibilidade com código em staging
- **Mitigação**: Manter API pública inalterada, adicionar apenas métodos novos

- **Risco**: Testes continuam flaky após implementação
- **Mitigação**: Implementar retry automático, adicionar logs de debug

### 5.2 Plano de Rollback
Se taxa de sucesso <90% após 2 dias:
1. Reverter commits da implementação
2. Restaurar versão anterior do `ProcessHandlerManager`
3. Executar suite de testes completa
4. Notificar equipe e stakeholders

## 6. Checklist de Execução

### Dia 1
- [ ] Implementar `resetForTesting()` no ProcessHandlerManager
- [ ] Tornar `setupProcessHandlers()` público
- [ ] Adicionar cleanup no `afterEach` dos testes
- [ ] Executar testes para validar mudanças básicas

### Dia 2
- [ ] Isolar handlers globais do Jest
- [ ] Criar setup específico para testes
- [ ] Validar todos os testes passando
- [ ] Executar script de validação 10x
- [ ] Documentar mudanças implementadas

### Validação Final
- [ ] 100% dos testes passando
- [ ] 0% de flakiness em 10 execuções
- [ ] Tempo de execução <3s
- [ ] Compatibilidade com produção mantida
- [ ] Documentação atualizada

## 7. Entregáveis

### 7.1 Código
- Método `resetForTesting()` implementado
- Método `setupProcessHandlers()` público
- Cleanup adequado no `afterEach`
- Isolamento de handlers globais

### 7.2 Validação
- Suite de testes 100% verde
- Script de validação executado com sucesso
- Métricas de qualidade validadas
- Documentação de mudanças

### 7.3 Próximos Passos
- Preparação para Sprint 2 (refatoração robusta)
- Identificação de melhorias adicionais
- Planejamento de testes de integração
