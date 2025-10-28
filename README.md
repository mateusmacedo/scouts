# Nx TypeScript/Go Blueprint Template

Template de workspace Nx para desenvolvimento de aplicações e bibliotecas com suporte a TypeScript, Go e NestJS.

## 🏗️ Estrutura do Template

### Diretórios Principais
- **`apps/`** - Aplicações (NestJS, Express, Go services)
- **`libs/`** - Bibliotecas compartilhadas (TypeScript, Go)
- **`docs/`** - Documentação técnica e guias
- **`scripts/`** - Scripts de automação e utilitários

### Sistema de Tags Multidimensionais
Os projetos utilizam tags para categorização, controle de dependências e arquitetura limpa:

#### Dimensões Principais
- **`type`**: `app` (aplicação), `lib` (biblioteca)
- **`scope`**: `internal` (interno), `notifier` (notificações)
- **`runtime`**: `node` (Node.js), `go` (Go), `universal` (múltiplos)
- **`layer`**: `domain` (domínio), `application` (aplicação), `infrastructure` (infraestrutura)
- **`visibility`**: `public` (público), `private` (privado), `internal` (interno)
- **`platform`**: `nest` (NestJS), `express` (Express.js)

#### Controle de Dependências
- **Arquitetura Limpa**: Respeita hierarquia de camadas (presentation → application → domain ← infrastructure)
- **Runtime Isolation**: Projetos Node não dependem de Go e vice-versa
- **Visibility Control**: `public` pode ser usado por qualquer projeto, `private` apenas internamente

Para detalhes completos, consulte [Sistema de Tags](docs/TAG_SYSTEM.md).

## 🔧 Características do Template

### Tecnologias Suportadas
- **TypeScript/Node.js**: NestJS, Express, bibliotecas Node.js
- **Go**: Serviços Go, bibliotecas Go
- **Ferramentas**: Biome (linting/formatação), Jest (testes), ESLint

### Padrões Arquiteturais
- **Clean Architecture**: Separação clara de camadas
- **Domain-Driven Design**: Bounded contexts e aggregates
- **Repository Pattern**: Abstração de acesso a dados
- **Event-Driven Architecture**: Comunicação assíncrona

## 🚀 Comandos Básicos

### Validação de Workspace

```bash
# Validar protocolo workspace:* em dependências locais
pnpm nx validate-workspace

# Verificar conformidade completa
pnpm nx run-many -t lint test build
```

### Build e Testes

```bash
# Build de todos os projetos afetados
pnpm nx affected -t build

# Testes de todos os projetos afetados
pnpm nx affected -t test

# Lint de todos os projetos afetados
pnpm nx affected -t lint

# Formatação de código com Biome
pnpm nx affected -t format

# Verificação de boundaries de módulos
pnpm nx affected -t check-boundaries
```

### Verificar Projetos

```bash
# Ver todos os projetos
pnpm nx show projects

# Ver detalhes de um projeto específico
pnpm nx show project bff-nest
```

## 📚 Documentação

### Documentação Técnica
- **[Arquitetura](docs/ARCHITECTURE.md)** - Arquitetura completa do monorepo
- **[Sistema de Tags](docs/TAG_SYSTEM.md)** - Controle de dependências
- **[Pipeline de Tasks](docs/TASK_PIPELINE.md)** - Execução e release
- **[Configuração de Cache](docs/CACHE_CONFIGURATION.md)** - Otimização de performance
- **[Guia de Flaky Tasks](docs/FLAKY_TASKS_GUIDE.md)** - Troubleshooting
- **[Procedimento Git Import](docs/GIT_IMPORT_PROCEDURE.md)** - Importação de projetos
- **[Geradores Nx](docs/NX_GENERATORS.md)** - Criação de projetos

### Sistema de Certificação
- **[Guia de Certificação](docs/standards/SECURITY_CERTIFICATION_GUIDE.md)** - Processo completo
- **[Template de Tarefa](docs/templates/SECURITY_CERTIFICATION_TASK_TEMPLATE.md)** - Checklist
- **[Certificados Workspace](docs/certificates/README.md)** - Índice de certificados

### Criar Novos Projetos

```bash
# Aplicação NestJS
pnpm nx g @nx/nest:application nova-app

# Aplicação Go
pnpm nx g @nx-go/nx-go:application nova-go-app

# Biblioteca TypeScript
pnpm nx g @nx/js:library nova-lib

# Biblioteca Go
pnpm nx g @nx-go/nx-go:library nova-go-lib
```

### Ver Geradores Disponíveis

```bash
# Listar todos os geradores
pnpm nx list

# Ver geradores específicos
pnpm nx list @nx/nest
pnpm nx list @nx-go/nx-go
```

## 🔄 Release e CI/CD

### Workflows Disponíveis

- **`ci.yml`** – Executa lint, testes e build apenas dos projetos afetados em pushes e pull requests, com caches de pnpm e Go para acelerar execuções.
- **`release.yml`** – Ao receber pushes na `main` (exceto commits de release), gera changelog, versiona os pacotes e publica artefatos utilizando os comandos `pnpm nx release version` e `pnpm nx release publish`.
- **`release-validation.yml`** – Valida PRs executando `pnpm nx release version --dry-run`, garantindo a conformidade das convenções de commit e a integridade da configuração de release antes do merge.

### Release de Projetos

```bash
# Pré-visualizar mudanças de versão e changelog
pnpm nx release version --dry-run

# Atualizar versões, changelog e tags localmente
pnpm release:version

# Publicar pacotes após versionamento
pnpm release:publish
```

Para detalhes adicionais do processo consulte:
- [Pipeline de Tasks](docs/TASK_PIPELINE.md)

### 🔐 Segredos e Variáveis de Ambiente

Os workflows dependem dos seguintes segredos configurados no repositório:

| Nome | Uso | Observações |
| --- | --- | --- |
| `NPM_TOKEN` | Autenticação para `pnpm nx release publish` publicar pacotes no npm. | Deve possuir permissão de publicação nos registries necessários. Também é exportado como `NODE_AUTH_TOKEN`. |
| `GITHUB_TOKEN` | Operações de versionamento, criação de changelog e push de tags realizados pelo Nx Release. | O token padrão (`secrets.GITHUB_TOKEN`) é suficiente quando o workflow declara `permissions: contents: write` (como em `release.yml`). Um token personalizado só é necessário em cenários especiais, como workflows executados a partir de forks ou quando permissões adicionais são exigidas. |

> **Nota:** O workflow de release deve conter:
> 
> **Configuração explícita do token no passo de checkout:**
> ```yaml
> - uses: actions/checkout@v4
>   with:
>     token: ${{ secrets.GITHUB_TOKEN }}
> ```
> 
> **Um passo para realizar o push das alterações (tags, changelog, etc):**
> ```yaml
> - name: Push changes
>   run: git push --follow-tags
> ```

## 🛠️ Ferramentas de Desenvolvimento

### Biome - Linting e Formatação
O template utiliza **Biome** como ferramenta principal para linting e formatação:
- **Linting**: Análise de código com regras configuráveis
- **Formatação**: Formatação automática de código
- **Performance**: Mais rápido que ESLint + Prettier
- **Configuração**: Baseada em `biome.json` e `libs/biome-base/biome.json`

```bash
# Formatar código
pnpm nx format

# Lint com Biome
pnpm nx biome

# Lint completo (Biome + ESLint)
pnpm nx lint
```

### Nx Console
Extensão para VSCode e IntelliJ que melhora a experiência de desenvolvimento:
- Execução de tarefas
- Geração de código
- Autocompletar melhorado

[Instalar Nx Console &raquo;](https://nx.dev/getting-started/editor-setup)

### Comandos Úteis

```bash
# Visualizar grafo de dependências
pnpm nx graph

# Executar tarefas em paralelo
pnpm nx run-many -t build --parallel=3

# Verificar cache
pnpm nx show projects --with-target=build

# Executar CI localmente (simula workflow)
pnpm nx ci

# Verificar projetos afetados
pnpm nx graph --affected
```

## 📖 Recursos Adicionais

- [Documentação Nx](https://nx.dev)
- [Geradores Nx](https://nx.dev/features/generate-code)
- [Nx Release](https://nx.dev/features/manage-releases)
- [Nx Plugins](https://nx.dev/concepts/nx-plugins)

### Comunidade Nx
- [Discord](https://go.nx.dev/community)
- [Twitter](https://twitter.com/nxdevtools)
- [LinkedIn](https://www.linkedin.com/company/nrwl)
- [YouTube](https://www.youtube.com/@nxdevtools)
