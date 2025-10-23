# Análise do workflow CI (run 18727086975)

## Visão geral
- **Workflow**: `CI`, configurado para rodar em qualquer push e em pull requests abertos contra `main` ou ramos `release/**`.【F:.github/workflows/ci.yml†L1-L22】
- **Concorrência**: garante apenas uma execução por ref ao usar `ci-${{ github.ref }}` como chave, cancelando execuções anteriores em andamento.【F:.github/workflows/ci.yml†L11-L13】
- **Permissões**: restringe a execução a `actions: write` e `contents: read`, suficientes para usar caches e ler o código sem expor credenciais extras.【F:.github/workflows/ci.yml†L15-L17】

## Jobs executados
### 1. `validate` (matriz `lint`, `test`, `build`)
- Executa em `ubuntu-latest` com matriz de três tarefas independentes e `fail-fast: false`, permitindo que falhas em uma tarefa não interrompam as demais.【F:.github/workflows/_reusable-validate.yml†L12-L18】
- Faz checkout com histórico completo (`fetch-depth: 0`) para que o Nx calcule os projetos afetados com base na comparação entre commits.【F:.github/workflows/_reusable-validate.yml†L19-L23】
- Pré-aquece caches de pnpm, Nx, módulos Go e artefatos de build para reduzir tempo de execução em runs subsequentes.【F:.github/workflows/_reusable-validate.yml†L24-L61】
- Padroniza versões das ferramentas: pnpm 9, Node.js 20 e Go 1.23, alinhando o ambiente local e o de CI.【F:.github/workflows/_reusable-validate.yml†L63-L80】
- Instala dependências via `pnpm install --frozen-lockfile`, define os SHAs usados pelo Nx (`nrwl/nx-set-shas`) e, em seguida, roda `pnpm nx affected -t <tarefa>` de acordo com a entrada da matriz.【F:.github/workflows/_reusable-validate.yml†L82-L89】
- Quando a tarefa é `test`, publica o diretório `coverage/` como artefato com retenção de sete dias, preservando relatórios para inspeção posterior.【F:.github/workflows/_reusable-validate.yml†L91-L97】

### 2. `check-go-sync` (apenas em pull requests)
- Roda somente em eventos `pull_request` para verificar se o serviço Go utiliza a mesma versão da biblioteca `libs/user-go` declarada no monorepo.【F:.github/workflows/_reusable-validate.yml†L99-L135】
- Após preparar o ambiente de Go, dá permissão ao script `scripts/sync-go-versions.sh` e o executa; se o script ajustar `apps/user-go-service/go.mod` ou `go.sum`, o job falha e avisa que o `go.mod` está desatualizado.【F:.github/workflows/_reusable-validate.yml†L127-L135】

## O que cada target valida
- **`lint`**: mapeado em `nx.json` para executar `biome lint` e `eslint` com correção automática por projeto, garantindo consistência de formatação e regras Nx (aplicado a apps e libs, como o BFF Nest).【F:nx.json†L87-L104】【F:apps/bff-nest/project.json†L7-L48】
- **`test`**: herda a configuração padrão do Nx com cache habilitado e entradas específicas para Jest; projetos Go utilizam os executores do plugin `@nx-go` para rodar `go test`, alinhando testes de Node/Nest e Go no mesmo pipeline.【F:nx.json†L76-L85】【F:apps/user-go-service/project.json†L8-L40】【F:libs/user-go/project.json†L8-L28】
- **`build`**: segue `targetDefaults` que dependem de builds ascendentes e armazenam artefatos em `dist/`; no caso do BFF Node, a etapa chama `webpack-cli build`, enquanto serviços Go usam `@nx-go/nx-go:build` apontando para o `main.go`.【F:nx.json†L65-L75】【F:apps/bff-nest/project.json†L7-L19】【F:apps/user-go-service/project.json†L8-L18】

## Sincronização de dependências Go
- O script `scripts/sync-go-versions.sh` obtém a versão publicada de `libs/user-go` (via `package.json`), tenta atualizá-la com `go get` e aplica `go mod tidy`. Se a versão esperada não estiver presente no `go.mod`, encerra com erro, reforçando a exigência de manter a dependência sincronizada.【F:scripts/sync-go-versions.sh†L1-L75】【F:apps/user-go-service/go.mod†L1-L7】【F:libs/user-go/package.json†L1-L10】

## Recomendações e pontos de atenção
- **Cálculo de projetos afetados**: a etapa `nrwl/nx-set-shas` depende de histórico completo para diferenciar base e head; garantir `fetch-depth: 0` (já aplicado) evita falhas ao calcular `nx affected` em ramos recém-criados.【F:.github/workflows/_reusable-validate.yml†L19-L89】
- **Correções automáticas**: como `lint` executa ferramentas em modo `--write/--fix`, rodar o workflow a partir de um estado sujo pode gerar diffs locais. Execute os mesmos comandos localmente antes de abrir PRs (`pnpm nx run-many -t lint`).【F:nx.json†L87-L104】
- **Sincronização Go**: manter `libs/user-go` e `apps/user-go-service` com a mesma versão evita falhas no job `check-go-sync`; utilize o script manualmente (`pnpm nx run @scouts/user-go-service:sync-go-deps`) sempre que versionar a lib Go.【F:apps/user-go-service/project.json†L29-L47】【F:scripts/sync-go-versions.sh†L52-L75】

## Como reproduzir localmente
1. Instale dependências com `pnpm install --frozen-lockfile` (mesmo comando usado na pipeline).【F:.github/workflows/_reusable-validate.yml†L82-L83】
2. Para uma checagem equivalente ao CI, use o script `pnpm ci`, que dispara `nx affected` para `lint`, `test` e `build` em paralelo, reproduzindo a matriz da pipeline.【F:package.json†L6-L13】
3. Em pull requests, execute também `pnpm nx run @scouts/user-go-service:sync-go-deps` para garantir que os manifests Go estejam alinhados antes do push.【F:apps/user-go-service/project.json†L29-L47】
