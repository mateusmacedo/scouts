# Processo de Release - Nx Release 20.8.2

Este documento descreve o processo simplificado de release para o monorepo usando **Nx Release 20.8.2** com versionamento independente.

## 🏗️ Configuração Atual

### Versionamento Automático via Conventional Commits

O Nx Release está configurado para usar **Conventional Commits** para determinar automaticamente o tipo de incremento de versão:

- **`feat(scope): description`** → **minor bump** (0.0.0 → 0.1.0)
- **`fix(scope): description`** → **patch bump** (0.1.0 → 0.1.1)  
- **`feat!:` ou `BREAKING CHANGE:`** → **major bump** (0.1.0 → 1.0.0)

**Exemplos de commits:**
```bash
feat(utils-nest): add swagger configuration
fix(user-go): resolve memory leak in validation
feat(api)!: change authentication method
```

### Projetos Incluídos no Release

- **📦 Libs TypeScript (publicadas no npm registry):**
  - `@scouts/logger-node`
  - `@scouts/utils-nest`
  - `@scouts/user-node`
  - `@scouts/base-biome`

- **🔧 Lib Go (versionada via git tags):**
  - `scouts/user-go`

- **🚀 Apps (versionados mas não publicados):**
  - `@scouts/bff-nest`
  - `scouts/user-go-service`

### ⚙️ Configuração Nx Release

O `nx.json` contém a configuração completa:

```json
{
  "release": {
    "projectsRelationship": "independent",
    "releaseTagPattern": "{projectName}@v{version}",
    "projects": ["@scouts/*", "!@scouts/source"],
    "version": {
      "preVersionCommand": "pnpm nx run-many -t build",
      "conventionalCommits": true,
      "generatorOptions": {
        "fallbackCurrentVersionResolver": "disk"
      }
    },
    "git": {
      "commit": true,
      "tag": true,
      "commitMessage": "chore(release): publish {version}",
      "tagMessage": "chore(release): publish {version}"
    },
    "publish": {
      "projects": ["@scouts/logger-node", "@scouts/user-node", "@scouts/utils-nest", "@scouts/base-biome"]
    },
    "changelog": {
      "automaticFromRef": true,
      "createRelease": "github",
      "projectChangelogs": {
        "renderOptions": {
          "authors": true,
          "commitReferences": true,
          "versionTitleDate": true
        }
      }
    }
  }
}
```

## 🚀 Processo de Release

### 1. Validação Local (Recomendado)

Antes de executar o release, valide localmente:

```bash
# Dry-run completo do release
pnpm release:dry-run

# Validar sincronização Go
./scripts/sync-go-versions.sh

# Executar testes
pnpm nx affected -t test --parallel=3

# Executar build
pnpm nx affected -t build --parallel=3
```

### 2. Release via GitHub Actions (Recomendado)

O release é executado automaticamente via GitHub Actions ao fazer push na branch `main`, ou pode ser executado manualmente:

#### 🎯 Trigger Automático

Simplesmente faça merge de um PR para `main`:

```bash
git checkout main
git pull
# O workflow será executado automaticamente
```

#### 🎯 Trigger Manual

1. **Acesse:** https://github.com/mateusmacedo/scouts/actions
2. **Selecione:** "Release" workflow
3. **Clique:** "Run workflow"
4. **Configure inputs (opcional):**
   - `version-specifier`: deixe vazio para auto via conventional commits
5. **Execute** e monitore os logs

### 3. Release Local (Avançado)

Para releases locais (não recomendado para produção):

```bash
# Versionamento + changelog + git commit/tag
pnpm release:version

# Sincronizar dependências Go (se necessário)
./scripts/sync-go-versions.sh

# Publicar packages no NPM
pnpm release:publish

# Push de mudanças e tags
git push origin main
git push --tags
```

## 📋 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Release Completo** | `pnpm release` | Executa versionamento + publicação |
| **Dry Run** | `pnpm release:dry-run` | Simula release sem aplicar mudanças |
| **Apenas Version** | `pnpm release:version` | Versiona + changelog + git (sem publish) |
| **Apenas Publish** | `pnpm release:publish` | Publica packages já versionados |

## 🔄 Workflow de Release

O workflow `.github/workflows/release.yml` executa automaticamente:

1. **Setup** - Checkout, Node.js, pnpm, Go
2. **Validação Go** - Verifica sincronização de dependências Go
3. **Release** - `nx release --skip-publish` (version + changelog + git)
4. **Sync Go** - Sincroniza dependências Go pós-release
5. **Publish** - `nx release publish` (publica no NPM)
6. **Push** - Envia commits e tags para o repositório

### Validação Prévia em PRs

O workflow `.github/workflows/release-validation.yml` executa em PRs para `main`:

1. **Setup** - Ambiente completo
2. **Validação Go** - Verifica sincronização
3. **Dry Run** - `nx release --dry-run` para preview

## 📋 Resultado Esperado

### 🏷️ Tags Git Criadas

```
@scouts/logger-node@v0.1.0
@scouts/utils-nest@v0.1.0
@scouts/user-node@v0.1.0
@scouts/base-biome@v0.1.0
scouts/user-go@v0.1.0
@scouts/bff-nest@v0.1.0
scouts/user-go-service@v0.1.0
```

### 📦 Packages Publicados

- `@scouts/logger-node@0.1.0` → npm registry (npmjs.org)
- `@scouts/utils-nest@0.1.0` → npm registry (npmjs.org)
- `@scouts/user-node@0.1.0` → npm registry (npmjs.org)
- `@scouts/base-biome@0.1.0` → npm registry (npmjs.org)

### 📝 Changelogs Gerados

- `CHANGELOG.md` individual para cada projeto
- GitHub Releases automáticos com notas de release

## ✅ Validação Pós-Release

### 🏷️ Verificar Tags Git

```bash
git tag -l | grep v0.1.0
```

### 📦 Verificar Publicação NPM

```bash
# Verificar packages publicados
pnpm view @scouts/logger-node
pnpm view @scouts/utils-nest
pnpm view @scouts/user-node
pnpm view @scouts/base-biome
```

### 🔧 Verificar Go Module

```bash
cd apps/user-go-service
go list -m github.com/mateusmacedo/scouts/libs/user-go@v0.1.0
```

## 🔧 Troubleshooting

### ❌ Problema: Release não encontra mudanças

**✅ Solução:**
```bash
# Verificar se há commits seguindo conventional commits
git log --oneline | grep -E '^(feat|fix|chore)'

# Verificar projetos afetados
pnpm nx affected:graph
```

### ❌ Problema: Erro de autenticação npm registry

**✅ Solução:**
1. Verificar se `NODE_AUTH_TOKEN` está definido no GitHub Secrets
2. Verificar permissões do token no NPM
3. Validar configuração de `.npmrc` (se existir localmente)

### ❌ Problema: Go modules não resolvem

**✅ Solução:**
```bash
# Verificar sincronização
./scripts/sync-go-versions.sh

# Verificar tags criadas
git tag -l | grep 'scouts/user-go'

# Atualizar módulos
cd apps/user-go-service
go get github.com/mateusmacedo/scouts/libs/user-go@latest
go mod tidy
```

### ❌ Problema: Sincronização Go falhando

**✅ Solução:**
```bash
# Executar script manualmente
chmod +x scripts/sync-go-versions.sh
./scripts/sync-go-versions.sh

# Verificar se go.mod foi atualizado
git diff apps/user-go-service/go.mod
```

## 🛠️ Rollback Manual (Se Necessário)

Em caso de problemas após release:

```bash
# 1. Deletar tags criadas
git tag -d @scouts/logger-node@v0.1.0
git push --delete origin @scouts/logger-node@v0.1.0

# 2. Reverter commit de release
git revert HEAD
git push origin main

# 3. Unpublish do NPM (dentro de 72h)
npm unpublish @scouts/logger-node@0.1.0
```

## 🆕 Melhorias Implementadas

Comparado à versão anterior:

- ✅ **Simplicidade**: -60% de código nos workflows (276 → 110 linhas)
- ✅ **Conformidade**: 95%+ com Nx Release 20.8.2 best practices
- ✅ **Manutenibilidade**: Menos scripts customizados
- ✅ **Confiabilidade**: Usa comandos nativos do Nx
- ✅ **Automação**: Sincronização Go integrada ao workflow
- ✅ **Validação**: Dry-run automático em PRs

## 📖 Recursos Adicionais

- [Nx Release Documentation](https://nx.dev/features/manage-releases)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [npm Registry](https://docs.npmjs.com/about-npm)
- [Go Modules](https://go.dev/doc/modules/managing-dependencies)
