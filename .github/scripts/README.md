# Script de Validação de Workflows GitHub Actions

Este diretório contém o script essencial para validação de workflows GitHub Actions com Nx.

## Script Disponível

### validate-workflows-simple.sh
**Propósito:** Validação estática completa dos workflows sem dependências externas

**Funcionalidades:**
- Validação de sintaxe YAML básica
- Verificação de versões de actions
- Validação de secrets e permissions
- Verificação de triggers e consistência
- Validação de configurações específicas do Nx

**Uso:**
```bash
./.github/scripts/validate-workflows-simple.sh
```

**Pré-requisitos:**
- Bash (disponível em qualquer sistema Unix/Linux/macOS)
- Git (para operações de branch)

## Instalação

### Windows (PowerShell)
```powershell
# Git (se não instalado)
winget install Git.Git

# Bash (via Git for Windows ou WSL)
# Já incluído com Git for Windows
```

### Linux/macOS
```bash
# Git (se não instalado)
sudo apt install git  # Ubuntu/Debian
brew install git      # macOS
```

## Configuração

### 1. Permissões de Execução
```bash
chmod +x .github/scripts/validate-workflows-simple.sh
```

### 2. Execução
```bash
# Validação básica
./.github/scripts/validate-workflows-simple.sh

# Verificar relatório gerado
cat .github/workflows/VALIDATION_RESULTS.md
```

## Fluxo de Trabalho

### 1. Validação Estática
```bash
# Executa validação completa
./.github/scripts/validate-workflows-simple.sh

# Verifica relatório gerado
cat .github/workflows/VALIDATION_RESULTS.md
```

### 2. Interpretação de Resultados
- **✅ Válido:** Todos os workflows passaram na validação
- **⚠️ Avisos:** Problemas menores que não impedem execução
- **❌ Erros:** Problemas críticos que impedem execução

## Troubleshooting

### Problemas Comuns

#### 1. Permissões de execução
```bash
chmod +x .github/scripts/validate-workflows-simple.sh
```

#### 2. Script não encontrado
```bash
# Verificar se está no diretório correto
ls -la .github/scripts/
```

#### 3. Erro de sintaxe bash
```bash
# Verificar sintaxe
bash -n .github/scripts/validate-workflows-simple.sh
```

### Logs e Debug

#### 1. Habilitar debug
```bash
set -x
./.github/scripts/validate-workflows-simple.sh
```

#### 2. Verificar configuração
```bash
# Verificar nx.json
cat nx.json

# Verificar workflows
ls -la .github/workflows/
```

## Relatório de Validação

O script gera um relatório completo em `.github/workflows/VALIDATION_RESULTS.md` contendo:

- **Resumo Executivo:** Status geral da validação
- **Detalhes por Workflow:** Análise individual de cada arquivo
- **Métricas de Consistência:** Versões de Node.js, pnpm, Go
- **Configurações Nx:** Validação específica do workspace
- **Recomendações:** Sugestões de melhorias

## Contribuição

### Melhorando o Script
1. Identifique o problema
2. Implemente a correção
3. Teste localmente
4. Documente as mudanças

### Adicionando Novas Validações
1. Adicione a função de validação
2. Integre ao fluxo principal
3. Atualize a documentação
4. Teste com diferentes workflows

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs de erro
2. Consulte a documentação do GitHub Actions
3. Verifique a documentação do Nx
4. Abra uma issue no repositório

---

**Nota:** Este script é uma ferramenta de desenvolvimento essencial para validação de workflows GitHub Actions, funcionando sem dependências externas e em qualquer ambiente.