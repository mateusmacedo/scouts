# Scripts de Validação de Workflows GitHub Actions

Este diretório contém scripts para validação, simulação e análise de performance dos workflows GitHub Actions com Nx.

## Scripts Disponíveis

### 1. validate-workflows.sh
**Propósito:** Validação estática completa dos workflows

**Funcionalidades:**
- Validação de sintaxe YAML
- Verificação de versões de actions
- Validação de secrets e permissions
- Verificação de triggers e consistência
- Validação de configurações específicas do Nx

**Uso:**
```bash
./.github/scripts/validate-workflows.sh
```

**Pré-requisitos:**
- `yamllint` (pip install yamllint)
- `gh` CLI (opcional, para validações avançadas)
- `jq` (opcional, para parsing JSON)

### 2. simulate-ci.sh
**Propósito:** Simulação local dos workflows para validação

**Funcionalidades:**
- Simulação de nx affected com diferentes bases
- Execução local de lint/test/build
- Verificação de cache do Nx
- Simulação de setup de dependências
- Geração de relatório de performance

**Uso:**
```bash
./.github/scripts/simulate-ci.sh
```

**Pré-requisitos:**
- `pnpm` (npm install -g pnpm)
- `go` (Go 1.23+)
- `nx` (npx nx@latest)
- `git` (para operações de branch)

### 3. analyze-workflow-performance.sh
**Propósito:** Análise de performance dos workflows via GitHub API

**Funcionalidades:**
- Consulta GitHub API para métricas de workflows
- Análise de tempo de execução por job/step
- Identificação de bottlenecks
- Geração de relatórios de performance
- Monitoramento em tempo real

**Uso:**
```bash
# Análise básica
./.github/scripts/analyze-workflow-performance.sh

# Análise com parâmetros
GITHUB_REPOSITORY=mateusmacedo/scouts WORKFLOW_NAME=CI RUNS_LIMIT=20 ./.github/scripts/analyze-workflow-performance.sh

# Monitoramento em tempo real
./.github/scripts/analyze-workflow-performance.sh monitor CI test/workflow-validation
```

**Pré-requisitos:**
- `gh` CLI (gh auth login)
- `jq` (para parsing JSON)
- Acesso ao repositório GitHub

## Instalação de Pré-requisitos

### Windows (PowerShell)
```powershell
# yamllint
pip install yamllint

# GitHub CLI
winget install GitHub.cli

# jq
winget install jqlang.jq

# pnpm
npm install -g pnpm

# Go
winget install GoLang.Go

# nx
npm install -g nx
```

### Linux/macOS
```bash
# yamllint
pip install yamllint

# GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# jq
sudo apt install jq

# pnpm
npm install -g pnpm

# Go
sudo apt install golang-go

# nx
npm install -g nx
```

## Configuração

### 1. Autenticação GitHub
```bash
gh auth login
```

### 2. Configuração de Variáveis de Ambiente
```bash
export GITHUB_REPOSITORY=mateusmacedo/scouts
export WORKFLOW_NAME=CI
export RUNS_LIMIT=10
```

### 3. Permissões de Execução
```bash
chmod +x .github/scripts/*.sh
```

## Fluxo de Trabalho Recomendado

### 1. Validação Estática
```bash
# Executa validação completa
./.github/scripts/validate-workflows.sh

# Verifica relatório gerado
cat .github/workflows/VALIDATION_RESULTS.md
```

### 2. Simulação Local
```bash
# Simula execução dos workflows
./.github/scripts/simulate-ci.sh

# Verifica relatório de performance
cat .github/workflows/PERFORMANCE_REPORT.md
```

### 3. Análise de Performance
```bash
# Analisa workflows reais
./.github/scripts/analyze-workflow-performance.sh

# Verifica relatório de análise
cat .github/workflows/PERFORMANCE_ANALYSIS.md
```

## Interpretação de Resultados

### Relatório de Validação
- **✅ Válido:** Todos os workflows passaram na validação
- **⚠️ Avisos:** Problemas menores que não impedem execução
- **❌ Erros:** Problemas críticos que impedem execução

### Relatório de Performance
- **Tempo de execução:** Duração total dos workflows
- **Cache hit rate:** Percentual de cache hits
- **Projetos afetados:** Número de projetos processados pelo Nx
- **Bottlenecks:** Steps que demoram mais de 30s

### Relatório de Análise
- **Métricas de tempo:** Por job e step
- **Status de execução:** Sucesso/falha dos workflows
- **Recomendações:** Otimizações identificadas

## Troubleshooting

### Problemas Comuns

#### 1. yamllint não encontrado
```bash
pip install yamllint
```

#### 2. gh CLI não autenticado
```bash
gh auth login
```

#### 3. jq não encontrado
```bash
# Windows
winget install jqlang.jq

# Linux
sudo apt install jq

# macOS
brew install jq
```

#### 4. nx não encontrado
```bash
npm install -g nx
```

#### 5. Permissões de execução
```bash
chmod +x .github/scripts/*.sh
```

### Logs e Debug

#### 1. Habilitar debug
```bash
set -x
./.github/scripts/validate-workflows.sh
```

#### 2. Verificar logs
```bash
# Logs do GitHub CLI
gh auth status

# Logs do Nx
nx report
```

#### 3. Verificar configuração
```bash
# Verificar nx.json
cat nx.json

# Verificar workflows
ls -la .github/workflows/
```

## Contribuição

### Adicionando Novos Scripts
1. Crie o script em `.github/scripts/`
2. Adicione documentação no README.md
3. Teste em ambiente local
4. Adicione ao fluxo de trabalho

### Melhorando Scripts Existentes
1. Identifique o problema
2. Implemente a correção
3. Teste localmente
4. Documente as mudanças

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs de erro
2. Consulte a documentação do GitHub Actions
3. Verifique a documentação do Nx
4. Abra uma issue no repositório

---

**Nota:** Estes scripts são ferramentas de desenvolvimento e devem ser executados em ambiente local para validação e análise dos workflows GitHub Actions.
