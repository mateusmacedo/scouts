# Lista de Modelos e Interfaces

A seguir está uma lista tabelada de todas as interfaces e classes abstratas que compõem os modelos do sistema. As tabelas estão organizadas por categoria para facilitar a compreensão.

---

## **Common**

| Interface/Classe   | Descrição                                                                             |
| ------------------ | ------------------------------------------------------------------------------------- |
| **Result\<T, E\>** | Representa o resultado de uma operação que pode ter sucesso (`Ok`) ou falhar (`Err`). |

---

## **CQRS**

| Interface/Classe                        | Descrição                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| **ICommand**                            | Interface marcadora para comandos no padrão CQRS.                               |
| **ICommandHandler\<TCommand, E\>**      | Interface para manipuladores de comandos do tipo `TCommand`.                    |
| **IQuery\<TResult\>**                   | Interface marcadora para consultas que retornam um resultado do tipo `TResult`. |
| **IQueryHandler\<TQuery, TResult, E\>** | Interface para manipuladores de consultas do tipo `TQuery`.                     |

---

## **Message Patterns**

| Interface/Classe                          | Descrição                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **IMessageChannel\<TMessage\>**           | Interface para canais de mensagens que facilitam comunicação assíncrona.                                    |
| **IMessageRouter\<TMessage\>**            | Interface para roteamento de mensagens baseado em regras definidas.                                         |
| **IMessageTranslator\<TInput, TOutput\>** | Interface para conversão entre diferentes formatos de mensagens, com validação de compatibilidade.          |
| **IMessageProcessor\<TMessage\>**         | Interface para processamento de mensagens com priorização e validação de capacidade de processamento.       |

---

## **Observability**

| Interface/Classe     | Descrição                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **IObservable\<T\>** | Interface para objetos observáveis com gerenciamento de múltiplos observadores e notificações de estado.  |
| **IObserver\<T\>**   | Interface para observadores com identificação única e tipagem, permitindo reação a mudanças de estado.    |

---

## **Testing**

| Interface/Classe  | Descrição                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **IContractTest** | Interface para testes de contrato com metadados e validação de conformidade entre implementações e suas interfaces.   |

---

## **Domain**

| Interface/Classe                 | Descrição                                                                 |
| -------------------------------- | ------------------------------------------------------------------------- |
| **IDomainEvent**                 | Representa um evento de domínio que ocorreu no sistema.                   |
| **AggregateRoot**               | Interface para agregados raiz no domínio, garantindo a consistência.      |
| **IRepository\<TAggregate, E\>** | Interface para repositórios que gerenciam agregados do tipo `TAggregate`. |

---

## **Event Sourcing**

| Interface/Classe              | Descrição                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **IEventStore**               | Interface para armazenamento e recuperação de eventos de domínio.               |
| **IEventBus**                 | Interface para publicação e assinatura de eventos de domínio.                   |
| **IProjection\<TReadModel\>** | Interface para projeções que atualizam modelos de leitura com base nos eventos. |

---

## **Read Model**

| Interface/Classe                          | Descrição                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| **IReadModelRepository\<TReadModel, E\>** | Interface para repositórios que gerenciam modelos de leitura do tipo `TReadModel`.        |
| **IProjection\<TReadModel\>**             | Interface para projeções que atualizam modelos de leitura com base nos eventos recebidos. |

---

## **Common Logging**

| Interface/Classe  | Descrição                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **ILogger**       | Interface para registro de logs no sistema, definindo diferentes níveis de log.                 |
| **ConsoleLogger** | Implementação de `ILogger` que registra logs no console. Útil para desenvolvimento e depuração. |

---

## **Security**

| Interface/Classe | Descrição                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **IDataMasking** | Interface para mascaramento de dados sensíveis, garantindo a proteção de informações confidenciais.                     |
| **DataMasking**  | Implementação de `IDataMasking` que mascara informações sensíveis, como números de cartão de crédito ou dados pessoais. |

---

## **Audit**

| Interface/Classe  | Descrição                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **IAuditService** | Interface para serviços de auditoria que registram ações realizadas no sistema, facilitando a rastreabilidade.                              |
| **AuditService**  | Implementação de `IAuditService` que registra ações para auditoria, podendo ser integrado com sistemas de log ou bancos de dados dedicados. |

---

## **Dependency Injection**

| Interface/Classe        | Descrição                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **IDependencyProvider** | Interface para provedor de dependências, facilitando a injeção de dependências no sistema.                                           |
| **DependencyProvider**  | Implementação de `IDependencyProvider` que gerencia instâncias de dependências, permitindo registro e recuperação por identificador. |

---

## **Policies**

| Interface/Classe      | Descrição                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **IPolicy**           | Interface para políticas de negócio que definem regras de validação e autorização.                                 |
| **MinimumRolePolicy** | Implementação de `IPolicy` que verifica se o usuário possui um papel mínimo requerido para realizar uma ação.      |
| **PolicyValidator**   | Classe para validar múltiplas políticas de negócio, garantindo que todas as condições necessárias sejam atendidas. |

---

## **Guards**

| Interface/Classe | Descrição                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **IGuard**       | Interface para guardas que controlam o acesso a recursos, verificando condições antes da execução de operações. |
| **RoleGuard**    | Implementação de `IGuard` que verifica o papel do usuário para determinar se o acesso é permitido.              |

---

## **Interceptors**

| Interface/Classe       | Descrição                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IInterceptor**       | Interface para interceptores que podem modificar ou inspecionar a execução de métodos, permitindo a adição de funcionalidades transversais como logging, autenticação ou autorização. |
| **LoggingInterceptor** | Implementação de `IInterceptor` que registra logs antes e depois da execução de métodos, auxiliando na monitoração e depuração.                                                       |

---

## **Middleware**

| Interface/Classe             | Descrição                                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IMiddleware**              | Interface para middlewares que processam requisições ou comandos, permitindo a adição de funcionalidades como autenticação, logging ou validação.          |
| **AuthenticationMiddleware** | Middleware para autenticação de usuários, verificando tokens de acesso e garantindo que apenas usuários autenticados possam acessar determinados recursos. |
| **LoggingMiddleware**        | Middleware para registro de logs durante o processamento de requisições, auxiliando na monitoração e depuração.                                            |
| **MiddlewareExecutor**       | Executor que aplica uma cadeia de middlewares em sequência, garantindo que cada middleware seja executado de forma ordenada.                               |

---

## **Exception Handling**

| Interface/Classe          | Descrição                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **IExceptionFilter**      | Interface para filtros de exceção que capturam e tratam erros não tratados, permitindo respostas consistentes e personalizadas.                                          |
| **GlobalExceptionFilter** | Implementação de `IExceptionFilter` que trata exceções globais no sistema, garantindo que erros sejam registrados e respostas apropriadas sejam retornadas aos clientes. |

---

## **Pipes**

| Interface/Classe   | Descrição                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IPipe\<T\>**     | Interface para pipes que transformam ou validam dados antes do processamento, permitindo a manipulação de dados de entrada ou saída de forma modular. |
| **ValidationPipe** | Implementação de `IPipe` que valida dados de entrada utilizando a biblioteca `class-validator`.                                                       |

---

## **Resilience**

| Interface/Classe   | Descrição                                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CircuitBreaker** | Implementação do padrão Circuit Breaker para resiliência em chamadas remotas. Previene chamadas repetidas a serviços que estão falhando, permitindo a recuperação gradual. |
| **RetryPolicy**    | Implementação de política de retentativas com backoff exponencial, permitindo que operações falhas sejam tentadas novamente após intervalos crescentes.                    |

---

## **Event-Driven Components**

| Interface/Classe       | Descrição                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IEventOrchestrator** | Interface para orquestradores de eventos que coordenam fluxos de trabalho baseados em eventos, garantindo que sequências de eventos sejam tratadas corretamente. |

---

## **Tracing**

| Interface/Classe | Descrição                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ITracing**     | Interface para sistemas de rastreamento distribuído, permitindo o monitoramento de solicitações que atravessam múltiplos serviços e componentes. |
| **ISpan**        | Interface para spans que representam uma unidade de trabalho no tracing, encapsulando informações sobre a operação.                              |
| **Tracer**       | Implementação de `ITracing` para criação e gerenciamento de spans, facilitando o rastreamento de operações distribuídas.                         |

---

## **Saga Pattern**

| Interface/Classe | Descrição                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ISaga**        | Interface para sagas que coordenam transações distribuídas, garantindo a consistência de operações que envolvem múltiplos serviços ou agregados. |
| **ISagaStep**    | Interface para passos individuais em uma saga, incluindo execução e compensa��ão, permitindo a implementação de fluxos de trabalho complexos.     |

---

## **Outbox Pattern**

| Interface/Classe      | Descrição                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OutboxMessage**     | Classe que representa uma mensagem armazenada no outbox para processamento posterior, garantindo a confiabilidade na publicação de eventos.       |
| **IOutboxRepository** | Interface para repositórios que gerenciam mensagens do outbox, permitindo a persistência e recuperação de mensagens para processamento posterior. |

---

## **Event Store Implementations**

| Interface/Classe       | Descrição                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **InMemoryEventStore** | Implementação de `IEventStore` em memória, útil para testes ou ambientes de desenvolvimento onde a persistência de eventos não é necess��ria. |

---

## **Event Bus Implementations**

| Interface/Classe | Descrição                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **RxEventBus**   | Implementação de `IEventBus` utilizando **RxJS** para gerenciamento de eventos reativos, permitindo assinaturas e publicações assíncronas. |

---

## **Messaging**

| Interface/Classe   | Descrição                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **IMessageBroker** | Interface para brokers de mensagens que gerenciam publicação e assinatura em filas, facilitando a comunicação assíncrona entre componentes. |
| **MessageBroker**  | Implementação de `IMessageBroker` que utiliza um broker de mensagens, como RabbitMQ ou Kafka, para gerenciar a comunicação entre serviços.  |

---

## **Considerações Finais**

### **Benefícios das Implementações**

- **Reutilização de Código:** Componentes genéricos e abstratos podem ser reutilizados em diferentes partes do sistema, reduzindo redundâncias.
- **Flexibilidade:** Facilita a extensão e a modificação de funcionalidades sem impactar diretamente o código específico de domínio.
- **Manutenção Simplificada:** Alterações em componentes base refletem automaticamente nas implementações concretas, facilitando a manutenção.
- **Consistência Arquitetural:** Garante que todas as partes do sistema sigam padrões e contratos definidos, promovendo uma arquitetura consistente.
- **Escalabilidade:** Componentes genéricos e agnósticos permitem que o sistema escale facilmente, adaptando-se a novos requisitos e mudanças.

### **Próximos Passos**

1. **Implementação Concreta:** Desenvolver implementações específicas para cada interface e classe abstrata conforme as necessidades do sistema.
2. **Integração com Infraestrutura Real:** Substituir implementações fictícias por integrações reais com bancos de dados, brokers de mensagens e outros serviços externos.
3. **Testes Automatizados:** Criar testes unitários e de integração para garantir que os componentes funcionem conforme esperado e que os contratos sejam respeitados.
4. **Documentação e Manutenção:** Manter a documentação atualizada, garantindo que as implementações reflitam o estado atual do sistema e facilitando o onboarding de novos desenvolvedores.

---

**Nota:**
Estas implementações são projetadas para serem independentes de qualquer contexto específico de negócio, permitindo que sejam adaptadas e utilizadas em diversos tipos de sistemas. Elas servem como blocos de construção para uma arquitetura limpa, modular e escalável, promovendo boas práticas de desenvolvimento e manutenção de software.
