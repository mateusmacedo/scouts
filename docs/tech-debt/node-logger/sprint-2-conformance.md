# Sprint 2: Refatoração Robusta - ProcessHandlerManager Tests

**Duração**: Dias 3-4 (10h total)  
**Prioridade**: P1 - ALTA  
**Objetivo**: Implementar arquitetura testável com injeção de dependência

## 1. Contexto e Objetivos

### 1.1 Pré-requisitos
- ✅ Sprint 1 concluído com sucesso
- ✅ 100% dos testes passando
- ✅ Isolamento básico implementado
- ✅ Compatibilidade com produção mantida

### 1.2 Objetivos do Sprint
- ✅ Implementar injeção de dependência para event listeners
- ✅ Criar arquitetura testável sem quebrar produção
- ✅ Adicionar testes de integração robustos
- ✅ Manter compatibilidade com código existente

## 2. Ações de Refatoração

### 2.1 Dia 3 (6h): Implementação de Arquitetura Testável

**Ação 3.1**: Criar interface `ProcessEventEmitter`

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.ts`

**Mudança**: Adicionar interface para abstrair `process.on/emit`

```typescript
/**
 * Interface for abstracting process event handling.
 * Allows dependency injection for testing purposes.
 */
export interface ProcessEventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  removeListener(event: string, listener: (...args: any[]) => void): void;
  removeAllListeners(event?: string): void;
}

/**
 * Default implementation using Node.js process object.
 */
export class NodeProcessEventEmitter implements ProcessEventEmitter {
  on(event: string, listener: (...args: any[]) => void): void {
    process.on(event, listener);
  }

  emit(event: string, ...args: any[]): boolean {
    return process.emit(event, ...args);
  }

  removeListener(event: string, listener: (...args: any[]) => void): void {
    process.removeListener(event, listener);
  }

  removeAllListeners(event?: string): void {
    process.removeAllListeners(event);
  }
}
```

**Ação 3.2**: Refatorar construtor para aceitar EventEmitter injetado

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.ts`

**Mudança**: Adicionar parâmetro opcional `eventEmitter` no construtor privado

```typescript
export class ProcessHandlerManager {
  private static instance: ProcessHandlerManager | null = null;
  private eventEmitter: ProcessEventEmitter;
  // ... outros campos existentes ...

  private constructor(eventEmitter?: ProcessEventEmitter) {
    this.eventEmitter = eventEmitter || new NodeProcessEventEmitter();
    this.sinks = new Map();
    this.buffers = new Map();
    this.isShuttingDown = false;
    this.setupProcessHandlers();
  }

  /**
   * Gets the singleton instance, creating it if necessary.
   * Uses default NodeProcessEventEmitter in production.
   */
  public static getInstance(): ProcessHandlerManager {
    if (!ProcessHandlerManager.instance) {
      ProcessHandlerManager.instance = new ProcessHandlerManager();
    }
    return ProcessHandlerManager.instance;
  }
}
```

**Ação 3.3**: Implementar factory method para testes

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.ts`

**Mudança**: Adicionar método estático `createForTesting()`

```typescript
/**
 * Creates a new instance for testing purposes with injected event emitter.
 * This method bypasses the singleton pattern to allow proper test isolation.
 * 
 * @param eventEmitter - Mock or test implementation of ProcessEventEmitter
 * @returns New ProcessHandlerManager instance
 */
public static createForTesting(eventEmitter: ProcessEventEmitter): ProcessHandlerManager {
  return new ProcessHandlerManager(eventEmitter);
}

/**
 * Resets the singleton instance for testing purposes.
 * Clears all event listeners, sinks, and internal state.
 * Should ONLY be used in test environments.
 */
public static resetForTesting(): void {
  if (ProcessHandlerManager.instance) {
    ProcessHandlerManager.instance.cleanupListeners();
    ProcessHandlerManager.instance.sinks.clear();
    ProcessHandlerManager.instance.buffers.clear();
    ProcessHandlerManager.instance.isShuttingDown = false;
  }
  ProcessHandlerManager.instance = null;
}
```

**Ação 3.4**: Refatorar `setupProcessHandlers()` para usar EventEmitter injetado

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.ts`

**Mudança**: Substituir chamadas diretas ao `process` pelo `eventEmitter`

```typescript
public setupProcessHandlers(): void {
  this.eventEmitter.on('SIGTERM', this.handleSigterm.bind(this));
  this.eventEmitter.on('SIGINT', this.handleSigint.bind(this));
  this.eventEmitter.on('uncaughtException', this.handleUncaughtException.bind(this));
  this.eventEmitter.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
}

private cleanupListeners(): void {
  this.eventEmitter.removeAllListeners('SIGTERM');
  this.eventEmitter.removeAllListeners('SIGINT');
  this.eventEmitter.removeAllListeners('uncaughtException');
  this.eventEmitter.removeAllListeners('unhandledRejection');
}
```

### 2.2 Dia 4 (4h): Refatoração de Testes e Integração

**Ação 4.1**: Refatorar testes para usar nova arquitetura

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.spec.ts`

**Mudança**: Implementar mocks adequados e injeção de dependência

```typescript
import { ProcessHandlerManager, ProcessEventEmitter } from './process-handler';

describe('ProcessHandlerManager', () => {
  let mockEventEmitter: jest.Mocked<ProcessEventEmitter>;
  let processHandlerManager: ProcessHandlerManager;

  beforeEach(() => {
    // Criar mock do EventEmitter
    mockEventEmitter = {
      on: jest.fn(),
      emit: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    } as jest.Mocked<ProcessEventEmitter>;

    // Criar instância para teste
    processHandlerManager = ProcessHandlerManager.createForTesting(mockEventEmitter);
  });

  afterEach(() => {
    ProcessHandlerManager.resetForTesting();
    jest.restoreAllMocks();
  });

  describe('Event Listener Setup', () => {
    it('should register all required event listeners', () => {
      expect(mockEventEmitter.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(mockEventEmitter.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockEventEmitter.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
      expect(mockEventEmitter.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });

    it('should handle SIGTERM signal correctly', () => {
      const sigtermHandler = mockEventEmitter.on.mock.calls
        .find(call => call[0] === 'SIGTERM')?.[1];
      
      expect(sigtermHandler).toBeDefined();
      
      // Simular chamada do handler
      sigtermHandler!();
      
      // Verificar comportamento esperado
      expect(processHandlerManager.isShuttingDown).toBe(true);
    });
  });
});
```

**Ação 4.2**: Adicionar 5 novos testes de integração

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.spec.ts`

**Mudança**: Adicionar testes end-to-end para validar comportamento completo

```typescript
describe('Integration Tests', () => {
  let mockEventEmitter: jest.Mocked<ProcessEventEmitter>;
  let processHandlerManager: ProcessHandlerManager;

  beforeEach(() => {
    mockEventEmitter = {
      on: jest.fn(),
      emit: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    } as jest.Mocked<ProcessEventEmitter>;

    processHandlerManager = ProcessHandlerManager.createForTesting(mockEventEmitter);
  });

  afterEach(() => {
    ProcessHandlerManager.resetForTesting();
  });

  it('should handle complete shutdown sequence on SIGTERM', async () => {
    // Simular sink registrado
    const mockSink = { flush: jest.fn().mockResolvedValue(undefined) };
    processHandlerManager.registerSink('test-sink', mockSink);

    // Simular SIGTERM
    const sigtermHandler = mockEventEmitter.on.mock.calls
      .find(call => call[0] === 'SIGTERM')?.[1];
    
    await sigtermHandler!();

    // Verificar que sink foi chamado
    expect(mockSink.flush).toHaveBeenCalled();
    expect(processHandlerManager.isShuttingDown).toBe(true);
  });

  it('should handle multiple sinks during shutdown', async () => {
    const mockSink1 = { flush: jest.fn().mockResolvedValue(undefined) };
    const mockSink2 = { flush: jest.fn().mockResolvedValue(undefined) };
    
    processHandlerManager.registerSink('sink1', mockSink1);
    processHandlerManager.registerSink('sink2', mockSink2);

    const sigtermHandler = mockEventEmitter.on.mock.calls
      .find(call => call[0] === 'SIGTERM')?.[1];
    
    await sigtermHandler!();

    expect(mockSink1.flush).toHaveBeenCalled();
    expect(mockSink2.flush).toHaveBeenCalled();
  });

  it('should handle sink flush errors gracefully', async () => {
    const mockSink = { 
      flush: jest.fn().mockRejectedValue(new Error('Flush failed')) 
    };
    
    processHandlerManager.registerSink('error-sink', mockSink);

    const sigtermHandler = mockEventEmitter.on.mock.calls
      .find(call => call[0] === 'SIGTERM')?.[1];
    
    // Não deve lançar erro mesmo com sink falhando
    await expect(sigtermHandler!()).resolves.not.toThrow();
  });

  it('should cleanup all listeners on shutdown', async () => {
    const sigtermHandler = mockEventEmitter.on.mock.calls
      .find(call => call[0] === 'SIGTERM')?.[1];
    
    await sigtermHandler!();

    // Verificar que cleanup foi chamado
    expect(mockEventEmitter.removeAllListeners).toHaveBeenCalledWith('SIGTERM');
    expect(mockEventEmitter.removeAllListeners).toHaveBeenCalledWith('SIGINT');
    expect(mockEventEmitter.removeAllListeners).toHaveBeenCalledWith('uncaughtException');
    expect(mockEventEmitter.removeAllListeners).toHaveBeenCalledWith('unhandledRejection');
  });

  it('should maintain singleton behavior in production', () => {
    // Reset para simular ambiente de produção
    ProcessHandlerManager.resetForTesting();
    
    const instance1 = ProcessHandlerManager.getInstance();
    const instance2 = ProcessHandlerManager.getInstance();
    
    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(ProcessHandlerManager);
  });
});
```

## 3. Critérios de Aceitação

### 3.1 Critérios Técnicos
- ✅ Interface `ProcessEventEmitter` implementada
- ✅ Construtor aceita EventEmitter injetado
- ✅ Factory method `createForTesting()` funcional
- ✅ Testes refatorados com mocks adequados
- ✅ 5 novos testes de integração implementados

### 3.2 Critérios de Qualidade
- ✅ Compatibilidade com código existente mantida
- ✅ API pública inalterada (sem breaking changes)
- ✅ Cobertura de testes ≥80% em `process-handler.ts`
- ✅ Performance mantida (<3s execução)

### 3.3 Critérios de Arquitetura
- ✅ Injeção de dependência implementada
- ✅ Separação clara entre produção e teste
- ✅ Mocks isolados e reutilizáveis
- ✅ Testes end-to-end validando comportamento real

## 4. Validação e Testes

### 4.1 Script de Validação Completa
```bash
#!/bin/bash
echo "=== Validação Sprint 2 ==="

# 1. Executar testes unitários
echo "1. Executando testes unitários..."
nx test logger-node --testPathPattern=process-handler.spec.ts

# 2. Executar testes de integração
echo "2. Executando testes de integração..."
nx test logger-node --testPathPattern=process-handler.spec.ts --testNamePattern="Integration Tests"

# 3. Validar cobertura
echo "3. Validando cobertura de código..."
nx test logger-node --coverage --testPathPattern=process-handler.spec.ts

# 4. Executar 10x para validar estabilidade
echo "4. Validando estabilidade (10 execuções)..."
for i in {1..10}; do
  echo "Execução $i/10"
  nx test logger-node --testPathPattern=process-handler.spec.ts
  if [ $? -ne 0 ]; then
    echo "Falha na execução $i"
    exit 1
  fi
done

echo "✅ Validação Sprint 2 concluída com sucesso"
```

### 4.2 Métricas de Sucesso
- **Taxa de sucesso**: 100% (18/18 testes)
- **Cobertura**: ≥80% em `process-handler.ts`
- **Flakiness rate**: 0%
- **Tempo de execução**: <3s
- **Testes de integração**: 5 novos implementados

## 5. Riscos e Mitigações

### 5.1 Riscos Identificados
- **Risco**: Quebra de compatibilidade com código existente
- **Mitigação**: Manter API pública inalterada, usar parâmetros opcionais

- **Risco**: Performance degradada com injeção de dependência
- **Mitigação**: Benchmarks antes/depois, otimização se necessário

- **Risco**: Complexidade aumentada para desenvolvedores
- **Mitigação**: Documentação clara, exemplos de uso

### 5.2 Plano de Rollback
Se problemas de compatibilidade ou performance:
1. Reverter para implementação do Sprint 1
2. Manter funcionalidade básica funcionando
3. Revisar arquitetura antes de nova tentativa

## 6. Checklist de Execução

### Dia 3
- [ ] Criar interface `ProcessEventEmitter`
- [ ] Implementar `NodeProcessEventEmitter`
- [ ] Refatorar construtor para aceitar EventEmitter
- [ ] Implementar factory method `createForTesting()`
- [ ] Refatorar `setupProcessHandlers()` para usar EventEmitter
- [ ] Executar testes para validar mudanças

### Dia 4
- [ ] Refatorar testes existentes com mocks
- [ ] Implementar 5 novos testes de integração
- [ ] Validar compatibilidade com código existente
- [ ] Executar script de validação completa
- [ ] Documentar mudanças arquiteturais

### Validação Final
- [ ] 100% dos testes passando (18/18)
- [ ] Cobertura ≥80% em `process-handler.ts`
- [ ] 0% de flakiness em 10 execuções
- [ ] Compatibilidade com produção mantida
- [ ] Performance mantida (<3s)
- [ ] Documentação atualizada

## 7. Entregáveis

### 7.1 Código
- Interface `ProcessEventEmitter` implementada
- Construtor refatorado com injeção de dependência
- Factory method `createForTesting()` funcional
- Testes refatorados com mocks adequados
- 5 novos testes de integração

### 7.2 Validação
- Suite de testes 100% verde (18/18)
- Cobertura de código ≥80%
- Script de validação executado com sucesso
- Métricas de qualidade validadas

### 7.3 Próximos Passos
- Preparação para Sprint 3 (documentação e validação)
- Identificação de melhorias adicionais
- Planejamento de certificação de segurança
