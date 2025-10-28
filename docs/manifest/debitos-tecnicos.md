# Especificação Genérica de Diagnóstico e Plano de Ação de Débitos Técnicos

## 1. Objetivos

- Inventariar débitos técnicos com evidências rastreáveis (arquivo:linha).
- Classificar riscos por Impacto e Probabilidade.
- Segmentar ações: Quick Wins, Médio Alcance, Estratégicas.
- Estabelecer baseline de métricas para comparação futura.
- Fornecer base formal para criação de backlog técnico (issues/épicos).

## 2. Taxonomia (Categorias)

1. Arquitetura & Modularização
2. Observabilidade (logging, tracing, métricas, APM)
3. Performance & Uso de Recursos
4. Confiabilidade & Resiliência
5. Segurança & Configuração
6. Qualidade de Código & Manutenibilidade
7. Gestão de Dependências
8. Build & Deploy
9. Banco de Dados & Acesso a Dados
10. Testes
11. Documentação & Operabilidade
12. Custos & Footprint

## 3. Fases de Análise

| Fase                   | Objetivo                        | Entradas                             | Saídas                           |
| ---------------------- | ------------------------------- | ------------------------------------ | -------------------------------- |
| 0. Preparação          | Definir contexto e critérios    | Ambientes, SLAs, domínio             | Escopo fechado                   |
| 1. Inventário Estático | Mapear configs e dependências   | go.mod, package.json, Dockerfile, CI | Lista preliminar                 |
| 2. Inspeção de Código  | Identificar padrões e anomalias | Pastas src/, cmd/, internal/, libs   | Débitos categorizados            |
| 3. Análise Dinâmica    | Observar comportamento          | Benchmarks, perf, métricas           | Ajustes de Impacto/Probabilidade |
| 4. Consolidação        | Unificar achados                | Fases 1–3                            | Matriz de riscos                 |
| 5. Priorização         | Ordenar por severidade          | Matriz                               | Backlog conceitual segmentado    |
| 6. Execução Técnica    | Aplicar recomendações           | Backlog                              | Estados atualizados              |
| 7. Avaliação Pós-Ação  | Medir objetivamente             | Baseline vs atual                    | Comparativo                      |
| 8. Relatório Final     | Formalizar resultado            | Tudo acima                           | Documento definitivo             |

## 4. Coleta de Artefatos (Adaptado por Stack)

### Go (Golang)

- go.mod / go.sum
- Estrutura de diretórios (cmd/, internal/, pkg/, api/, migrations/)
- Arquivos main.go (um ou múltiplos binários)
- Configuração de DI (se houver: wire, fx, uber dig)
- Configuração de log (zap, zerolog, slog)
- Middleware HTTP / gRPC (chi, gin, echo, fiber, grpc interceptors)
- Ferramentas de geração (ent, sqlc, protobuf, openapi)
- Scripts Makefile ou Taskfile
- Dockerfile / scripts de build cross-compilation
- Config de lint (golangci-lint)
- Testes (arquivos *_test.go, diretórios de integration)

### TypeScript / JavaScript

- package.json / lock (pnpm-lock, yarn.lock)
- tsconfig.* / swc / babel / nest-cli.json / eslint config
- Arquivo bootstrap (ex.: src/main.ts)
- Módulos globais (AppModule, loaders)
- Middlewares, interceptors, pipes, filters
- Schemas de validação (class-validator, Zod, Joi)
- Implementação de APM / tracing / logger (pino, winston, OpenTelemetry)
- Scripts Nx / turborepo / build custom
- Dockerfile / multi-stage builds

### Comuns

- Configuração de variáveis de ambiente (schema explicitamente validado)
- Pipelines CI/CD (lint, testes, security scan, build)
- Manifests de deploy (k8s, helm, compose)
- Observabilidade (exporters de métricas, dashboards definidos)

## 5. Registro de Débito (Modelo)

| Campo           | Descrição                                    |
| --------------- | -------------------------------------------- |
| ID              | Ex.: DT-OBS-001                              |
| Categoria       | Uma das categorias da taxonomia              |
| Descrição       | Enunciado objetivo                           |
| Evidência       | Caminho + linha(s)                           |
| Impacto         | Efeito negativo potencial textual            |
| Probabilidade   | Frequência estimada (com justificativa)      |
| Severidade      | Impacto × Probabilidade                      |
| Segmento        | Quick Win / Médio Alcance / Estratégico      |
| Recomendação    | Ação imperativa concreta                     |
| Risco de Inação | Consequência factual                         |
| Dependências    | Pré-condições                                |
| Estado          | Aberto / Em Progresso / Resolvido / Validado |

## 6. Classificação

### Impacto (I)

1 = Baixo
2 = Moderado
3 = Relevante
4 = Alto
5 = Crítico

### Probabilidade (P)

1 = Raro
2 = Ocasional
3 = Recorrente
4 = Frequente
5 = Contínuo

Severidade = I × P
Faixas: Alta (≥12), Média (8–11), Baixa (<8).

## 7. Segmentos

| Segmento      | Definição                                                         |
| ------------- | ----------------------------------------------------------------- |
| Quick Win     | Escopo isolado de alteração, impacto direto, baixo acoplamento    |
| Médio Alcance | Atinge várias unidades/modos de execução                          |
| Estratégico   | Afeta arquitetura, padrões transversais ou dependências nucleares |

## 8. Métricas Baseline (Foco Go + TS)

| Categoria  | Métrica                | Go (Exemplos de Coleta)           | TS/JS (Exemplos de Coleta)     |
| ---------- | ---------------------- | --------------------------------- | ------------------------------ |
| HTTP       | p50/p95/p99            | Prometheus + chi/echo middleware  | Nest interceptor / prom-client |
| Throughput | RPS                    | Vegeta / hey / autocannon         | k6 / autocannon                |
| CPU        | Uso médio / saturação  | pprof / container metrics         | process.cpuUsage + APM         |
| Memória    | Heap / RSS             | pprof heap / runtime.ReadMemStats | process.memoryUsage            |
| GC         | Tempo / pausas         | pprof gc stats                    | Node GC logs (--trace-gc)      |
| DB         | Latência, slow queries | SQL logs / otel instrumentation   | APM spans / query logger       |
| Cache      | Hit ratio              | Métrica custom Redis              | prom-client custom counter     |
| Logging    | Logs/s, tamanho        | Centralização (Loki, Elastic)     | Elastic / Loki / Datadog       |
| Build      | Tempo build binário    | go build -x timing                | tsc/swc tempo / bundler        |
| Imagem     | Tamanho final          | docker image inspect              | docker image inspect           |
| Testes     | Cobertura              | go test -coverprofile             | jest --coverage                |
| Tracing    | Spans/request          | OTEL collector                    | OTEL / APM                     |

## 9. Padrões e Achados Típicos por Stack

### Go – Exemplos de Débitos Frequentes

| Categoria       | Achado Típico                                                         | Evidência Esperada                                   |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| Arquitetura     | Ausência de separação internal/ pkg/ cmd                              | Estrutura plana sem internal/                        |
| Observabilidade | Falta de context propagation (context.Background em cadeia)           | Funções iniciando context.Background() repetidamente |
| Performance     | Handlers com alocação excessiva                                       | pprof heap/allocations apontando funções específicas |
| Resiliência     | Falta de timeouts em http.Client                                      | http.Client sem Timeout declarado                    |
| Segurança       | Uso direto de fmt.Printf para logs (sem redaction)                    | Chamadas espalhadas no código                        |
| Dependências    | go.mod com versões transitivas muito antigas                          | go list -u -m all sinalizando múltiplos upgrades     |
| Build & Deploy  | Imagem não multi-stage                                                | Dockerfile único usando imagem pesada                |
| DB              | Uso de database/sql sem controle de SetMaxOpenConns / SetMaxIdleConns | main.go sem configuração de pool                     |
| Testes          | Baixa cobertura em pacotes críticos                                   | Relatório coverprofile com < linha alvo              |

### TypeScript / JavaScript – Exemplos de Débitos Frequentes

| Categoria       | Achado Típico                                            | Evidência Esperada                        |
| --------------- | -------------------------------------------------------- | ----------------------------------------- |
| Arquitetura     | Monólito sem divisão modular coerente                    | src/ com tudo em um módulo                |
| Observabilidade | Mistura de múltiplos APMs ativos                         | Imports e bootstrap de mais de um agente  |
| Performance     | Uso indiscriminado de class-transformer/class-validator  | DTOs complexos em rotas críticas          |
| Resiliência     | Ausência de AbortController/timeout em axios/fetch       | Chamada HTTP sem timeout global           |
| Segurança       | Variáveis de ambiente não validadas                      | Ausência de schema (Joi/Zod) no bootstrap |
| Dependências    | Bibliotecas duplicadas (ex.: date-fns + moment ou luxon) | package.json com ambas                    |
| Build & Deploy  | Execução com tsc puro sem otimização (SWC/ESBuild)       | Sem config builder rápido em monorepos    |
| DB              | N+1 queries em loops async/await sequenciais             | Services com for + await query            |
| Testes          | Apenas E2E ou apenas unit isoladamente                   | Ausência de pirâmide equilibrada          |
| Custos          | Middleware de compressão global em payloads pequenos     | main.ts registra compressão sem filtro    |

## 10. Exemplos de Recomendação (Go vs TS/JS)

### Go (Exemplo)

```text
ID: DT-OBS-005
Categoria: Observabilidade
Descrição: Falta de propagação de context em chamadas internas
Evidência: internal/service/user/service.go:42
Impacto: Perda de tracing e cancelamento em cascata
Probabilidade: Frequente (todas as chamadas usam context.Background)
Severidade: 4 × 4 = 16
Segmento: Médio Alcance
Recomendação: Substituir context.Background por propagação do ctx recebido nos handlers
Risco de Inação: Dificuldade em diagnosticar travamentos e timeouts ocultos
Dependências: Nenhuma
Estado: Aberto
```

### TypeScript (Exemplo)

```text
ID: DT-PERF-011
Categoria: Performance & Uso de Recursos
Descrição: Dupla instrumentação APM ativa
Evidência: src/apm/index.ts:15–33
Impacto: Overhead de CPU/memória em cada request
Probabilidade: Recorrente (presente em todo bootstrap)
Severidade: 3 × 3 = 9
Segmento: Quick Win
Recomendação: Condicionar inicialização a variável APM_AGENT única
Risco de Inação: Utilização de recursos desnecessária
Dependências: Definir variável de ambiente final
Estado: Aberto
```

## 11. Formato de Backlog Conceitual

Ordenação primária: Severidade (desc).
Agrupamentos auxiliares: Categoria → Segmento.
Quick Wins de Alta Severidade recebem destaque inicial para execução.
Estratégicos agrupam tópicos (ex.: “Refatorar Observabilidade”, “Camada de Acesso a Dados”).

## 12. Relatório Final (Estrutura)

````markdown
# Relatório de Débitos Técnicos – <REPOSITÓRIO>

## Sumário Executivo
(Distribuição de severidades e categorias)

## 1. Escopo e Metodologia

## 2. Métricas Baseline

## 3. Inventário Completo
(Tabela com todos os itens)

## 4. Top 10 Alta Severidade

## 5. Recomendações por Categoria

## 6. Segmentos Estratégicos

## 7. Itens Resolvidos

## 8. Anexos
A: Evidências de Código
B: Critérios de Classificação
C: Glossário
````

## 13. Papéis

| Papel           | Responsabilidade                           |
| --------------- | ------------------------------------------ |
| Tech Lead       | Validação de severidade e coerência        |
| Observabilidade | Expor métricas faltantes                   |
| Backend (Go)    | Ajustar context, pooling, pprof            |
| Backend (TS)    | Ajustar bootstrap, middlewares, validações |
| DevOps          | Otimização de build e imagens              |
| QA              | Garantir integridade funcional             |
| Segurança       | Revisão de dependências, env e segredos    |

## 14. Ferramentas Indicadas

| Objetivo           | Go                                    | TS/JS                               |
| ------------------ | ------------------------------------- | ----------------------------------- |
| Benchmark          | hey, vegeta                           | autocannon, k6                      |
| Profiling CPU/Heap | pprof, go tool trace                  | clinic flame/doctor, 0x             |
| Métricas           | Prometheus client_golang              | prom-client / OTEL                  |
| Tracing            | OpenTelemetry SDK Go                  | OpenTelemetry JS                    |
| Dependências       | govulncheck, go outdated              | osv-scanner, npm audit              |
| Lint               | golangci-lint                         | ESLint / Biome                      |
| Segurança          | trivy (imagem), govulncheck           | trivy, npm audit                    |
| Build Otimizado    | Multi-stage + CGO off quando possível | SWC / ESBuild / tree-shaking        |
| Análise Estrutural | go vet, staticcheck                   | ts-node --type-check / tsc --noEmit |

## 15. Checklist Operacional

```markdown
[ ] Coletar go.mod / package.json / Dockerfile / CI
[ ] Mapear módulos principais (Go: internal/, cmd/ — TS: src/modules)
[ ] Identificar bootstrap de observabilidade (APM, tracing, logger)
[ ] Verificar context propagation (Go) e interceptors (TS)
[ ] Auditar dependências duplicadas ou concorrentes
[ ] Mapear validação de entrada (schema vs decorators)
[ ] Catalogar itens no modelo de débito
[ ] Atribuir Impacto e Probabilidade
[ ] Calcular Severidade e segmentar
[ ] Ordenar e gerar inventário final
[ ] Definir baseline de métricas
```

## 16. Riscos e Contramedidas

| Risco                                | Consequência                               | Contramedida                            |
| ------------------------------------ | ------------------------------------------ | --------------------------------------- |
| Ausência de context propagation (Go) | Cancelamentos ignorados e goroutines órfãs | Forçar passagem explícita de ctx        |
| APM duplo (TS)                       | Overhead constante                         | Unificar agente e condicionar bootstrap |
| Falta de schema env                  | Falhas silenciosas de config               | Validar env no startup com schema       |
| Cache local apenas                   | Alta pressão em DB                         | Introduzir cache distribuído (Redis)    |
| Middleware global custoso            | Latência adicionada em todas rotas         | Condicionar e aplicar seletivamente     |
| Dependências não auditadas           | Vulnerabilidades                           | Pipeline de scan contínuo               |

## 17. Glossário

| Termo           | Definição                                                   |
| --------------- | ----------------------------------------------------------- |
| Context (Go)    | Mecanismo de cancelamento, deadlines e metadados de request |
| Quick Win       | Ação isolada e direta com retorno claro                     |
| Severidade      | Produto de Impacto × Probabilidade                          |
| Segmento        | Classificação de alcance qualitativo                        |
| Observabilidade | Conjunto de logging, métricas e tracing                     |

## 18. Sequência de Início

1. Coleta de artefatos (Go + TS).
2. Inspeção bootstrap (main.go, main.ts).
3. Registro dos primeiros 10 débitos de maior impacto.
4. Cálculo de severidade e segmentação.
5. Geração de relatório final.
