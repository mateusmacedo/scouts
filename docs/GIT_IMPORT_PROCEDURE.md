# Procedimento de Importação Git com Preservação de Histórico

Este documento descreve como importar projetos externos para o workspace Nx mantendo o histórico Git completo.

## Visão Geral

O Nx oferece ferramentas nativas para importar projetos preservando o histórico Git. Este procedimento garante que:

- Todo o histórico de commits seja mantido
- Autores e datas originais sejam preservados
- Branches e tags sejam importados corretamente
- O projeto seja integrado ao workspace sem perda de contexto

## Métodos de Importação

### 1. Importação Automática (Nx 19.8+)

O comando `nx import` é a forma mais simples e recomendada:

```bash
# Importar um repositório Git completo
nx import https://github.com/usuario/projeto.git

# Importar um repositório específico com branch
nx import https://github.com/usuario/projeto.git --branch=main

# Importar para um diretório específico
nx import https://github.com/usuario/projeto.git --directory=apps/novo-projeto
```

### 2. Importação Manual com Git Subtree

Para casos mais complexos ou quando `nx import` não atende:

```bash
# 1. Adicionar o repositório como remote
git remote add projeto-origem https://github.com/usuario/projeto.git

# 2. Fazer fetch do histórico
git fetch projeto-origem

# 3. Usar subtree para importar
git subtree add --prefix=apps/novo-projeto projeto-origem/main --squash

# 4. Configurar o projeto no Nx
nx g @nx/js:lib novo-projeto --directory=apps/novo-projeto
```

### 3. Importação com Git Filter-Branch

Para reescrever histórico durante a importação:

```bash
# 1. Clonar o repositório em diretório temporário
git clone https://github.com/usuario/projeto.git temp-projeto
cd temp-projeto

# 2. Reorganizar estrutura de diretórios
git filter-branch --tree-filter 'mkdir -p apps/novo-projeto && git mv * apps/novo-projeto/ 2>/dev/null || true' HEAD

# 3. Adicionar como remote no workspace
cd ../workspace
git remote add temp-projeto ../temp-projeto

# 4. Fazer merge do histórico
git fetch temp-projeto
git merge temp-projeto/main --allow-unrelated-histories

# 5. Limpar
git remote remove temp-projeto
rm -rf ../temp-projeto
```

## Configuração Pós-Importação

### 1. Configurar project.json

Após a importação, configure o projeto:

```json
{
  "name": "novo-projeto",
  "sourceRoot": "apps/novo-projeto/src",
  "projectType": "application",
  "tags": ["type:app", "scope:imported"],
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/novo-projeto",
        "main": "apps/novo-projeto/src/main.ts",
        "tsConfig": "apps/novo-projeto/tsconfig.app.json"
      }
    }
  }
}
```

### 2. Configurar Tags

Aplique tags apropriadas baseadas na análise do projeto:

```json
{
  "tags": [
    "type:app",           // ou "type:lib"
    "scope:imported",     // indicar origem
    "runtime:node",       // runtime específico
    "layer:application",   // camada arquitetural
    "visibility:private"  // visibilidade
  ]
}
```

### 3. Configurar Dependências

Atualize dependências para usar protocolo workspace:

```json
{
  "dependencies": {
    "@scouts/logger-node": "workspace:*",
    "@scouts/utils-nest": "workspace:*"
  }
}
```

## Estratégias de Merge

### 1. Merge Simples

Para projetos sem conflitos:

```bash
git merge projeto-importado/main --allow-unrelated-histories
```

### 2. Merge com Estratégia

Para resolver conflitos de estrutura:

```bash
git merge projeto-importado/main --allow-unrelated-histories -X ours
```

### 3. Rebase Interativo

Para limpar histórico durante importação:

```bash
git rebase -i projeto-importado/main
```

## Preservação de Metadados

### 1. Manter Autores Originais

```bash
# Configurar git para preservar autores
git config merge.ours.driver true
```

### 2. Preservar Tags

```bash
# Importar tags do projeto original
git fetch projeto-origem --tags
git tag -l | xargs -I {} git tag {} projeto-origem/{}
```

### 3. Preservar Branches

```bash
# Importar branches importantes
git checkout -b feature/projeto-importado projeto-origem/feature-branch
```

## Validação Pós-Importação

### 1. Verificar Histórico

```bash
# Verificar se commits foram preservados
git log --oneline --grep="commit-original"

# Verificar autores
git log --pretty=format:"%an %ae" | sort | uniq
```

### 2. Verificar Estrutura

```bash
# Verificar se arquivos foram importados
ls -la apps/novo-projeto/

# Verificar se dependências estão corretas
pnpm install
```

### 3. Testar Build

```bash
# Verificar se projeto builda corretamente
nx build novo-projeto

# Verificar se testes passam
nx test novo-projeto
```

## Troubleshooting

### Problema: Conflitos de Merge

**Solução:**
```bash
# Resolver conflitos manualmente
git status
# Editar arquivos conflitantes
git add .
git commit -m "Resolve merge conflicts from import"
```

### Problema: Histórico Perdido

**Solução:**
```bash
# Verificar se remote ainda existe
git remote -v

# Refazer fetch se necessário
git fetch projeto-origem --all
```

### Problema: Dependências Quebradas

**Solução:**
```bash
# Reinstalar dependências
pnpm install

# Verificar protocolo workspace
nx run validate-workspace
```

## Boas Práticas

1. **Sempre faça backup** antes de importar projetos grandes
2. **Teste em branch separada** antes de integrar ao main
3. **Documente a origem** do projeto importado
4. **Configure tags apropriadas** imediatamente após importação
5. **Valide dependências** usando o script de validação
6. **Mantenha histórico limpo** com commits descritivos

## Exemplos de Uso

### Importar Biblioteca Node.js

```bash
# 1. Importar
nx import https://github.com/org/lib-node.git --directory=libs/lib-node

# 2. Configurar
# Editar libs/lib-node/project.json com tags apropriadas

# 3. Validar
nx run validate-workspace
nx build lib-node
```

### Importar Aplicação React

```bash
# 1. Importar
nx import https://github.com/org/app-react.git --directory=apps/app-react

# 2. Configurar dependências
# Editar apps/app-react/package.json

# 3. Configurar build
# Editar apps/app-react/project.json

# 4. Validar
nx run validate-workspace
nx build app-react
```

## Referências

- [Nx Import Documentation](https://nx.dev/guides/adopting-nx/import-project)
- [Git Subtree Documentation](https://git-scm.com/docs/git-subtree)
- [Git Filter-Branch Documentation](https://git-scm.com/docs/git-filter-branch)

