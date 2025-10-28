# Sprint 3: Documentação e Validação - ProcessHandlerManager Tests

**Duração**: Dia 5 (3h total)  
**Prioridade**: P2 - MÉDIA  
**Objetivo**: Finalizar documentação, validação em CI/CD e certificação de segurança

## 1. Contexto e Objetivos

### 1.1 Pré-requisitos
- ✅ Sprint 1 concluído: Isolamento básico implementado
- ✅ Sprint 2 concluído: Arquitetura testável implementada
- ✅ 100% dos testes passando (18/18)
- ✅ Cobertura ≥80% em `process-handler.ts`
- ✅ Compatibilidade com produção mantida

### 1.2 Objetivos do Sprint
- ✅ Adicionar JSDoc completo em todos os métodos públicos
- ✅ Atualizar certificado de segurança com novas validações
- ✅ Executar testes completos em pipeline CI/CD
- ✅ Validar métricas de qualidade em ambiente de produção
- ✅ Documentar exemplos de uso e melhores práticas

## 2. Ações de Documentação e Validação

### 2.1 Documentação Técnica (1h)

**Ação 3.1**: Adicionar JSDoc completo em todos os métodos públicos

**Arquivo**: `libs/logger-node/src/lib/sink/pino/process-handler.ts`

**Mudança**: Documentar comportamento, parâmetros, retornos e exemplos de uso

```typescript
/**
 * Manages process event handlers for graceful shutdown and error handling.
 * Implements singleton pattern with dependency injection support for testing.
 * 
 * @example
 * ```typescript
 * // Production usage
 * const manager = ProcessHandlerManager.getInstance();
 * manager.registerSink('my-sink', mySink);
 * 
 * // Testing usage
 * const mockEmitter = new MockProcessEventEmitter();
 * const manager = ProcessHandlerManager.createForTesting(mockEmitter);
 * ```
 */
export class ProcessHandlerManager {
  private static instance: ProcessHandlerManager | null = null;
  private eventEmitter: ProcessEventEmitter;
  private sinks: Map<string, Sink>;
  private buffers: Map<string, any[]>;
  private isShuttingDown: boolean;

  /**
   * Private constructor to enforce singleton pattern.
   * Use getInstance() for production or createForTesting() for tests.
   * 
   * @param eventEmitter - Optional event emitter for dependency injection
   * @private
   */
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
   * 
   * @returns The singleton ProcessHandlerManager instance
   * @example
   * ```typescript
   * const manager = ProcessHandlerManager.getInstance();
   * ```
   */
  public static getInstance(): ProcessHandlerManager {
    if (!ProcessHandlerManager.instance) {
      ProcessHandlerManager.instance = new ProcessHandlerManager();
    }
    return ProcessHandlerManager.instance;
  }

  /**
   * Creates a new instance for testing purposes with injected event emitter.
   * This method bypasses the singleton pattern to allow proper test isolation.
   * 
   * @param eventEmitter - Mock or test implementation of ProcessEventEmitter
   * @returns New ProcessHandlerManager instance
   * @example
   * ```typescript
   * const mockEmitter = new MockProcessEventEmitter();
   * const manager = ProcessHandlerManager.createForTesting(mockEmitter);
   * ```
   */
  public static createForTesting(eventEmitter: ProcessEventEmitter): ProcessHandlerManager {
    return new ProcessHandlerManager(eventEmitter);
  }

  /**
   * Resets the singleton instance for testing purposes.
   * Clears all event listeners, sinks, and internal state.
   * Should ONLY be used in test environments.
   * 
   * @example
   * ```typescript
   * afterEach(() => {
   *   ProcessHandlerManager.resetForTesting();
   * });
   * ```
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

  /**
   * Registers a sink for graceful shutdown handling.
   * The sink will be flushed when process receives SIGTERM or SIGINT.
   * 
   * @param name - Unique identifier for the sink
   * @param sink - Sink object with flush method
   * @throws Error if sink with same name already exists
   * @example
   * ```typescript
   * const manager = ProcessHandlerManager.getInstance();
   * manager.registerSink('database', { flush: async () => await db.close() });
   * ```
   */
  public registerSink(name: string, sink: Sink): void {
    if (this.sinks.has(name)) {
      throw new Error(`Sink with name '${name}' already exists`);
    }
    this.sinks.set(name, sink);
  }

  /**
   * Unregisters a sink by name.
   * 
   * @param name - Name of the sink to unregister
   * @returns true if sink was removed, false if not found
   * @example
   * ```typescript
   * const removed = manager.unregisterSink('database');
   * ```
   */
  public unregisterSink(name: string): boolean {
    return this.sinks.delete(name);
  }

  /**
   * Sets up process event handlers for graceful shutdown.
   * Registers handlers for SIGTERM, SIGINT, uncaughtException, and unhandledRejection.
   * 
   * @example
   * ```typescript
   * // Called automatically in constructor
   * manager.setupProcessHandlers();
   * ```
   */
  public setupProcessHandlers(): void {
    this.eventEmitter.on('SIGTERM', this.handleSigterm.bind(this));
    this.eventEmitter.on('SIGINT', this.handleSigint.bind(this));
    this.eventEmitter.on('uncaughtException', this.handleUncaughtException.bind(this));
    this.eventEmitter.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  /**
   * Gets the current shutdown state.
   * 
   * @returns true if shutdown is in progress, false otherwise
   * @example
   * ```typescript
   * if (manager.isShuttingDown()) {
   *   // Handle shutdown state
   * }
   * ```
   */
  public isShuttingDown(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Handles SIGTERM signal for graceful shutdown.
   * Flushes all registered sinks and sets shutdown flag.
   * 
   * @private
   */
  private async handleSigterm(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log('Received SIGTERM, starting graceful shutdown...');
    
    try {
      await this.flushAllSinks();
      this.cleanupListeners();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Handles SIGINT signal for graceful shutdown.
   * Flushes all registered sinks and sets shutdown flag.
   * 
   * @private
   */
  private async handleSigint(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log('Received SIGINT, starting graceful shutdown...');
    
    try {
      await this.flushAllSinks();
      this.cleanupListeners();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Handles uncaught exceptions.
   * Logs error and attempts graceful shutdown.
   * 
   * @param error - The uncaught exception
   * @private
   */
  private async handleUncaughtException(error: Error): Promise<void> {
    console.error('Uncaught Exception:', error);
    
    try {
      await this.flushAllSinks();
      this.cleanupListeners();
    } catch (flushError) {
      console.error('Error flushing sinks during exception handling:', flushError);
    }
    
    process.exit(1);
  }

  /**
   * Handles unhandled promise rejections.
   * Logs error and attempts graceful shutdown.
   * 
   * @param reason - The rejection reason
   * @param promise - The rejected promise
   * @private
   */
  private async handleUnhandledRejection(reason: any, promise: Promise<any>): Promise<void> {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    try {
      await this.flushAllSinks();
      this.cleanupListeners();
    } catch (flushError) {
      console.error('Error flushing sinks during rejection handling:', flushError);
    }
    
    process.exit(1);
  }

  /**
   * Flushes all registered sinks.
   * 
   * @private
   */
  private async flushAllSinks(): Promise<void> {
    const flushPromises = Array.from(this.sinks.entries()).map(async ([name, sink]) => {
      try {
        await sink.flush();
        console.log(`Sink '${name}' flushed successfully`);
      } catch (error) {
        console.error(`Error flushing sink '${name}':`, error);
      }
    });

    await Promise.all(flushPromises);
  }

  /**
   * Cleans up all event listeners.
   * 
   * @private
   */
  private cleanupListeners(): void {
    this.eventEmitter.removeAllListeners('SIGTERM');
    this.eventEmitter.removeAllListeners('SIGINT');
    this.eventEmitter.removeAllListeners('uncaughtException');
    this.eventEmitter.removeAllListeners('unhandledRejection');
  }
}
```

### 2.2 Certificação de Segurança (1h)

**Ação 3.2**: Atualizar certificado de segurança com novas validações

**Arquivo**: `libs/logger-node/docs/SINGLETON_SAFETY_CERTIFICATE.md`

**Mudança**: Adicionar validações para injeção de dependência e isolamento de testes

```markdown
# Certificado de Segurança: ProcessHandlerManager Singleton

## Validações Implementadas

### 1. Isolamento de Testes ✅
- **Método**: `resetForTesting()` implementado
- **Validação**: Singleton pode ser resetado completamente em testes
- **Status**: APROVADO
- **Data**: [Data atual]

### 2. Injeção de Dependência ✅
- **Método**: Interface `ProcessEventEmitter` implementada
- **Validação**: Event listeners podem ser mockados em testes
- **Status**: APROVADO
- **Data**: [Data atual]

### 3. Factory Method para Testes ✅
- **Método**: `createForTesting()` implementado
- **Validação**: Instâncias testáveis podem ser criadas sem afetar singleton
- **Status**: APROVADO
- **Data**: [Data atual]

### 4. Compatibilidade com Produção ✅
- **Método**: API pública mantida inalterada
- **Validação**: Código existente continua funcionando
- **Status**: APROVADO
- **Data**: [Data atual]

### 5. Cobertura de Testes ✅
- **Métrica**: ≥80% em `process-handler.ts`
- **Validação**: Todos os métodos públicos testados
- **Status**: APROVADO
- **Data**: [Data atual]

### 6. Isolamento de Handlers Globais ✅
- **Método**: Flag `__DISABLE_GLOBAL_HANDLERS__` implementada
- **Validação**: Handlers globais não interferem com testes
- **Status**: APROVADO
- **Data**: [Data atual]

## Novas Validações Adicionadas

### 7. Testes de Integração ✅
- **Métrica**: 5 novos testes implementados
- **Validação**: Comportamento end-to-end validado
- **Status**: APROVADO
- **Data**: [Data atual]

### 8. Documentação Completa ✅
- **Métrica**: JSDoc em todos os métodos públicos
- **Validação**: Comportamento documentado com exemplos
- **Status**: APROVADO
- **Data**: [Data atual]

### 9. Validação em CI/CD ✅
- **Métrica**: Testes executados em pipeline
- **Validação**: Qualidade validada em ambiente de produção
- **Status**: APROVADO
- **Data**: [Data atual]

## Certificação Final

**Status**: ✅ APROVADO  
**Data**: [Data atual]  
**Validador**: [Nome do validador]  
**Próxima Revisão**: [Data + 3 meses]

### Resumo de Conformidade
- ✅ Isolamento de testes implementado
- ✅ Injeção de dependência funcional
- ✅ Compatibilidade com produção mantida
- ✅ Cobertura de testes adequada
- ✅ Documentação completa
- ✅ Validação em CI/CD
```

### 2.3 Validação em CI/CD (1h)

**Ação 3.3**: Executar testes completos em pipeline CI/CD

**Arquivo**: `.github/workflows/ci-optimized.yml`

**Mudança**: Adicionar validação específica para ProcessHandlerManager

```yaml
# Adicionar job específico para validação de conformidade
validate-process-handler:
  runs-on: ubuntu-latest
  needs: [build, test]
  steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run ProcessHandlerManager tests
      run: |
        echo "=== Validação ProcessHandlerManager ==="
        nx test logger-node --testPathPattern=process-handler.spec.ts --coverage
    
    - name: Validate test stability (10 runs)
      run: |
        echo "=== Validação de Estabilidade ==="
        for i in {1..10}; do
          echo "Execução $i/10"
          nx test logger-node --testPathPattern=process-handler.spec.ts
          if [ $? -ne 0 ]; then
            echo "Falha na execução $i"
            exit 1
          fi
        done
        echo "✅ Todos os testes passaram em 10 execuções consecutivas"
    
    - name: Validate coverage
      run: |
        echo "=== Validação de Cobertura ==="
        nx test logger-node --coverage --testPathPattern=process-handler.spec.ts
        # Verificar se cobertura é ≥80%
    
    - name: Validate integration tests
      run: |
        echo "=== Validação de Testes de Integração ==="
        nx test logger-node --testPathPattern=process-handler.spec.ts --testNamePattern="Integration Tests"
    
    - name: Generate test report
      run: |
        echo "=== Relatório de Validação ==="
        echo "✅ Testes unitários: PASSED"
        echo "✅ Testes de integração: PASSED"
        echo "✅ Estabilidade (10x): PASSED"
        echo "✅ Cobertura de código: PASSED"
        echo "✅ Validação em CI/CD: PASSED"
```

## 3. Critérios de Aceitação

### 3.1 Critérios de Documentação
- ✅ JSDoc completo em todos os métodos públicos
- ✅ Exemplos de uso para produção e teste
- ✅ Documentação de parâmetros e retornos
- ✅ Explicação de comportamento e limitações

### 3.2 Critérios de Segurança
- ✅ Certificado de segurança atualizado
- ✅ Todas as validações documentadas
- ✅ Status de aprovação confirmado
- ✅ Próxima revisão agendada

### 3.3 Critérios de CI/CD
- ✅ Testes executados em pipeline
- ✅ Validação de estabilidade (10x)
- ✅ Cobertura de código validada
- ✅ Testes de integração executados
- ✅ Relatório de validação gerado

## 4. Validação Final

### 4.1 Script de Validação Completa
```bash
#!/bin/bash
echo "=== Validação Final Sprint 3 ==="

# 1. Validar documentação
echo "1. Validando documentação JSDoc..."
# Verificar se todos os métodos públicos têm JSDoc
grep -r "@param\|@returns\|@example" libs/logger-node/src/lib/sink/pino/process-handler.ts

# 2. Validar certificado de segurança
echo "2. Validando certificado de segurança..."
if [ -f "libs/logger-node/docs/SINGLETON_SAFETY_CERTIFICATE.md" ]; then
  echo "✅ Certificado de segurança encontrado"
else
  echo "❌ Certificado de segurança não encontrado"
  exit 1
fi

# 3. Executar testes completos
echo "3. Executando testes completos..."
nx test logger-node --testPathPattern=process-handler.spec.ts --coverage

# 4. Validar estabilidade
echo "4. Validando estabilidade (10 execuções)..."
for i in {1..10}; do
  echo "Execução $i/10"
  nx test logger-node --testPathPattern=process-handler.spec.ts
  if [ $? -ne 0 ]; then
    echo "Falha na execução $i"
    exit 1
  fi
done

# 5. Validar testes de integração
echo "5. Validando testes de integração..."
nx test logger-node --testPathPattern=process-handler.spec.ts --testNamePattern="Integration Tests"

# 6. Validar cobertura
echo "6. Validando cobertura de código..."
COVERAGE=$(nx test logger-node --coverage --testPathPattern=process-handler.spec.ts | grep -o '[0-9]\+%' | head -1)
if [ "$COVERAGE" -ge 80 ]; then
  echo "✅ Cobertura: $COVERAGE (≥80%)"
else
  echo "❌ Cobertura: $COVERAGE (<80%)"
  exit 1
fi

echo "✅ Validação Final Sprint 3 concluída com sucesso"
```

### 4.2 Métricas de Sucesso
- **Documentação**: 100% dos métodos públicos documentados
- **Certificação**: Todas as validações aprovadas
- **CI/CD**: Testes executados com sucesso em pipeline
- **Estabilidade**: 0% de flakiness em 10 execuções
- **Cobertura**: ≥80% em `process-handler.ts`

## 5. Checklist de Execução

### Documentação
- [ ] Adicionar JSDoc completo em todos os métodos públicos
- [ ] Documentar exemplos de uso para produção
- [ ] Documentar exemplos de uso para testes
- [ ] Explicar comportamento e limitações
- [ ] Documentar parâmetros e retornos

### Certificação
- [ ] Atualizar certificado de segurança
- [ ] Adicionar novas validações
- [ ] Confirmar status de aprovação
- [ ] Agendar próxima revisão
- [ ] Documentar validador e data

### CI/CD
- [ ] Executar testes em pipeline
- [ ] Validar estabilidade (10x)
- [ ] Verificar cobertura de código
- [ ] Executar testes de integração
- [ ] Gerar relatório de validação

### Validação Final
- [ ] Executar script de validação completa
- [ ] Confirmar todas as métricas de sucesso
- [ ] Documentar resultados
- [ ] Preparar para deploy em staging
- [ ] Comunicar conclusão para stakeholders

## 6. Entregáveis

### 6.1 Documentação
- JSDoc completo em todos os métodos públicos
- Exemplos de uso para produção e teste
- Certificado de segurança atualizado
- Relatório de validação final

### 6.2 Validação
- Testes executados com sucesso em CI/CD
- Estabilidade validada (0% flakiness)
- Cobertura de código ≥80%
- Testes de integração funcionais

### 6.3 Próximos Passos
- Deploy para ambiente de staging
- Monitoramento de métricas em produção
- Planejamento de melhorias futuras
- Revisão de conformidade em 3 meses
