<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors


<!-- nx configuration end-->

# 🏗️ Repository-Specific Instructions

## Overview

This is a **monorepo managed by Nx** containing applications and libraries for TypeScript/NestJS and Go projects. The workspace follows strict quality standards with automated CI/CD, comprehensive testing, and release management.

## Technologies and Stack

### Primary Technologies
- **Nx 20.8.2** - Monorepo build system with task orchestration and caching
- **TypeScript 5.7.2** - Primary language for Node.js projects
- **Go 1.23** - For microservices and libraries
- **NestJS 10.x** - Backend framework for Node.js applications
- **Jest 29.x** - Testing framework for TypeScript/JavaScript
- **pnpm 9.15.0** - Package manager (use pnpm, NOT npm or yarn)

### Code Quality Tools
- **Biome 2.2.6** - Primary linting and formatting tool (preferred over ESLint/Prettier)
- **ESLint 9.x** - Additional linting (use via `nx lint`)
- **SonarQube** - Quality gate integration in CI/CD

## Project Structure

### Applications (`apps/`)
- **`bff-nest`** - Backend for Frontend in NestJS
- **`user-go-service`** - User microservice in Go

### Libraries (`libs/`)
- **`logger-node`** - Modular logging system with correlation IDs, sensitive data redaction, and metrics
- **`utils-nest`** - NestJS utilities (health checks, Swagger, logger adapter)
- **`user-node`** - User domain library for Node.js
- **`user-go`** - User domain library for Go
- **`biome-base`** - Shared Biome configuration

### Tagging System
Projects use tags for categorization:
- `npm:public` - Published to npm registry
- `npm:private` - Internal use only
- `go:public` - Go library versioned via git tags
- `type:app` - Application
- `type:lib` - Library
- `scope:internal` - Internal workspace scope

## Development Commands

### Running Tasks
**ALWAYS use Nx commands** instead of direct tool invocation:

```bash
# Build affected projects
pnpm nx affected -t build

# Test affected projects
pnpm nx affected -t test

# Lint affected projects
pnpm nx affected -t lint

# Format code with Biome
pnpm nx affected -t format

# Run specific project
pnpm nx serve bff-nest
pnpm nx serve user-go-service

# Run all checks (like CI)
pnpm nx ci
```

### Code Quality
```bash
# Format with Biome (preferred)
pnpm nx format

# Check linting (Biome + ESLint)
pnpm nx lint

# Run tests with coverage
pnpm nx affected -t test --coverage
```

## Code Standards

### TypeScript/NestJS
- Use **strict TypeScript** settings - NO `any` types
- Follow **Clean Architecture** principles (domain, application, infrastructure layers)
- Use **dependency injection** via NestJS decorators
- Implement proper **error handling** with custom exceptions
- Add **comprehensive JSDoc comments** for public APIs
- Write **unit tests** using Jest with meaningful test names
- Use **class-validator** and **class-transformer** for DTOs

### Go
- Follow **Go 1.23 standards** and idiomatic Go patterns
- Use **Go modules** for dependency management
- Write **table-driven tests** for comprehensive coverage
- Include **godoc comments** for exported functions/types
- Use **interfaces** for abstraction and testability
- Handle errors explicitly - NO panic in library code

### General Principles
- **SOLID principles** - Single responsibility, dependency inversion, etc.
- **Low coupling, high cohesion** between modules
- **Meaningful naming** - clear, professional, intention-revealing
- **Security by design** - authentication, authorization, least privilege
- **Observability** - structured logs with correlation IDs, metrics, tracing
- **NO hardcoded secrets** - use environment variables or secret managers

## Testing Requirements

### Coverage Expectations
- **Unit tests** - Core business logic (domain layer)
- **Integration tests** - Infrastructure interactions (repositories, external APIs)
- **E2E tests** - Complete user flows (for applications)

### Test Standards
- Use **realistic test data** - avoid generic "test" or "foo/bar" values
- Write **clear assertions** - specific, meaningful error messages
- Test **edge cases** - null values, empty arrays, error conditions
- Ensure **test isolation** - each test should be independent
- **Mock external dependencies** - use Jest mocks or test doubles

## CI/CD and Workflows

### Workflow Architecture
The repository uses **reusable workflow components**:
- `ci.yml` - Main validation orchestrator
- `release.yml` - Manual release workflow
- `release-validation.yml` - Validates release branches
- `_reusable-*` - Shared workflow components (setup, validate, quality-gate, release-steps)

### Before Committing
1. **Run local validation**: `pnpm nx ci`
2. **Format code**: `pnpm nx format`
3. **Fix linting issues**: `pnpm nx affected -t lint --fix`
4. **Verify tests pass**: `pnpm nx affected -t test`
5. **Check builds**: `pnpm nx affected -t build`

### Commit Standards
- Follow **Conventional Commits** (feat, fix, chore, docs, test, refactor, ci, build)
- Keep messages **≤ 100 characters**
- Use **clear scope**: `feat(logger-node): add correlation ID support`
- Add **body only when needed** - explain "why" not "what"

## Release Process

### Version Management
- Uses **Nx Release** with independent versioning per project
- Projects tagged with `npm:public` or `go:public` are publishable
- Manual release via GitHub Actions (`release.yml`)

### Release Commands
```bash
# Preview release changes
pnpm nx release --specifier=minor --dry-run

# Create release
pnpm nx release --specifier=minor

# Publish packages
pnpm nx release publish
```

## Important Notes

### What to Do
- **Preserve existing patterns** - follow established code structure
- **Use workspace generators** - create new projects via Nx generators
- **Verify before modifying** - check existing implementations first
- **Update documentation** - keep README and docs in sync with code
- **Test incrementally** - validate changes frequently during development
- **Ask for clarification** - when requirements are ambiguous

### What NOT to Do
- **Don't use npm or yarn** - pnpm is the required package manager
- **Don't bypass Nx** - always use `nx` commands for tasks
- **Don't ignore linting** - Biome and ESLint rules are enforced
- **Don't skip tests** - comprehensive testing is mandatory
- **Don't modify CI workflows** without understanding the architecture
- **Don't commit build artifacts** - dist/, node_modules/, etc. are gitignored
- **Don't introduce breaking changes** without discussing first

## Documentation References

- [NX Generators Guide](docs/NX_GENERATORS.md) - Creating new projects
- [Release Process](docs/RELEASE_PROCESS.md) - Version management and publishing
- [Workflows Architecture](docs/WORKFLOWS_ARCHITECTURE.md) - CI/CD design and components

---

# 📘 Global Engineering Communication & Execution Rules

## Visão Geral

Estas regras consolidam diretrizes de **comunicação, engenharia, execução e qualidade técnica**, aplicáveis a todos os fluxos de trabalho, automações, revisões e interações com repositórios, código ou pipelines.

---

## ✅ Seções Principais

### ✅ DEVE

**Princípios de Comunicação e Pensamento**

* Usar `context7` para manter rastreabilidade decisão → ação → resultado.
* Aplicar pensamento sequencial: cada etapa deve derivar logicamente da anterior.
* Responder em português técnico e formal, com completude, consistência e clareza.
* Ser objetivo e direto — garantindo autossuficiência e coerência contextual.
* Explicitar dependências, versões, limitações e decisões — não assumir por inferência.
* Verificar scripts e workflows existentes antes de criar novos.
* Consultar histórico Git para entender o contexto funcional antes de modificar código ou automações.
* Fazer análise minuciosa, detalhista e pragmática em cada revisão.
* Remover configurações órfãs, temporárias ou obsoletas após mudanças.
* Validar que arquivos e caminhos referenciados existem — evitando referências quebradas.
* Aplicar SOLID, baixo acoplamento, alta coesão e Clean Architecture.
* Usar nomenclatura significativa e consistente, preferindo nomes profissionais e diretos.
* Comunicar limitações e incertezas técnicas — evitando afirmações absolutas sem verificação empírica.
* Ser cauteloso com afirmações de certeza — qualificando o grau de confiança e a base de evidência.
* Atualizar status e progresso de forma transparente — permitindo visibilidade de riscos e pendências.
* Manter o usuário no controle das decisões importantes, oferecendo contexto, alternativas e recomendações.
* Fazer apenas o que é solicitado, sem extrapolar o escopo.
* Validar antes de aplicar mudanças — planejamento, testes e impacto.
* Ser cuidadoso e preciso no trabalho, nas análises e implementações.

### ⚠️ Governança e Manutenção Documental

* Revisar periodicamente as documentações técnicas para garantir consistência, atualidade e alinhamento com padrões vigentes.
* Validar se novas bibliotecas, módulos ou frameworks adotados seguem os padrões técnicos e de arquitetura estabelecidos.
* Atualizar documentações sempre que houver mudanças significativas em fluxos, dependências, decisões ou padrões.
* Manter foco tecnológico em cada documentação específica — evitando diluição conceitual ou mistura de contextos entre tecnologias.
* Garantir rastreabilidade entre o conteúdo documentado e sua implementação real (repositórios, ADRs, RFCs, diagramas e automações).
* Estabelecer revisões periódicas de consistência cruzada entre os níveis C4 (Context, Container, Component e Code).
* Promover aprendizado organizacional — cada revisão documental deve contribuir para o amadurecimento técnico coletivo.

### ❌ NÃO DEVE

* Pressupor que algo não existe sem verificação explícita.
* Executar operações Git sem permissão expressa do usuário — toda ação de push, merge ou rebase deve ser confirmada.
* Modificar código, workflows ou configurações não solicitadas.
* Reescrever quando basta corrigir — foco em “corrigir, não reescrever”.
* Ignorar validações prévias (existência de arquivos, referências de workflows, checks CI/CD).
* Usar `any` em TypeScript, expor segredos ou quebrar isolamento de contexto.
* Violar controle do usuário sobre o repositório (push forçado, branch override).
* Criar arquivos ou artefatos desnecessários — evitar ruído e dívida operacional.

### 🧩 Código e Qualidade Técnica

* Entregar código completo e funcional, sem placeholders ou lacunas de implementação.
* Comentar brevemente cada bloco crítico, explicando propósito e lógica local.
* Respeitar arquitetura limpa — separação clara entre domínio, aplicação e infraestrutura.
* Incluir testes unitários, de integração e e2e com dados realistas e asserts claros.
* Testar mais extensivamente antes de declarar “pronto” — incluir cenários de erro e condições-limite.
* Executar revisões técnicas com foco em reprodutibilidade e robustez.
* Garantir testabilidade e observabilidade em cada módulo (logs estruturados, tracing, métricas com `correlation-id` e `tenant`).
* Aplicar segurança por design — autenticação, autorização e princípio do menor privilégio.
* Evitar anti-padrões (segredos hardcoded, logs sensíveis, dependências não rastreadas).

### 🧠 Estilo e Objetividade na Comunicação

* Respostas devem ser completas e autossuficientes, sem depender de contexto externo.
* Explicitar claramente hipóteses quando inferências forem necessárias.
* Separar fatos de suposições — marcar hipóteses explicitamente.
* Usar estrutura organizada, tópicos claros e terminologia técnica precisa.
* Ser conservador nas ações — realizar o mínimo necessário para resolver o problema.
* Perguntar antes de agir, especialmente para operações destrutivas ou automatizadas.
* Atualizar status de forma transparente — comunicar progresso e limitações.

### 🧾 Commits e Controle de Versão

* Seguir Conventional Commits (≤ 100 caracteres, escopo claro).
* Incluir body apenas quando necessário, descrevendo raciocínio técnico e impactos.
* Manter consistência semântica: feat, fix, refactor, chore, test, docs, build, ci.
* Evitar commits ruidosos — cada mudança deve ter um propósito técnico justificável.

### 🔍 Testabilidade, Observabilidade e Segurança

* Cobertura de testes: unitários (core), integração (infra) e e2e (fluxo completo).
* Observabilidade: logs estruturados, tracing, métricas e correlação.
* Segurança: autenticação, autorização, criptografia e segregação de privilégios.
* Nunca armazenar segredos no código ou nos logs.
* Identificar gaps de monitoramento e documentar limitações.

### 🧭 Três Caminhos Práticos de Ação

#### ✅ Reformular Pergunta

* “Você quer que eu apenas valide e liste ajustes mínimos sem aplicar mudanças diretas?”
* “Deseja que eu corrija apenas o erro X, mantendo o restante inalterado e criando PR, não push?”

#### ⚠️ Explorar Hipóteses

* Hipóteses: redundância de workflows, configurações obsoletas, histórico inconsistente.
* Riscos: regressões em CI/CD, perda de histórico, dependências ocultas.
* Mitigações: validação incremental, dry-run, aprovação em PR.

#### ✅ Confirmar Operação

* Sempre solicitar permissão antes de operações Git.
* Procurar existência real de scripts/workflows, histórico Git, referências e segredos.
* Termos de busca: `uses:`, `path:.github/workflows/`, `Ref not found`, `deprecated`.
* Fontes: histórico Git, logs CI, CODEOWNERS, políticas de branch.
* Limitação: sem acesso direto, conclusões são **hipóteses**.

---

## 💬 Síntese Filosófica

> “Menos é mais.” — Corrigir, não reescrever.
> “O usuário decide.” — Permissão explícita antes de Git.
> “Prever é testar.” — Declaração de pronto requer evidência.
> “Transparência constrói confiança.” — Limitações e progresso devem ser visíveis.
