# Processo de Release - Nx Independent Versioning (Modernizado)

Este documento descreve o processo completo de release para o monorepo usando Nx Release com versionamento independente, **agora com trigger manual via GitHub Actions** para maior segurança e controle.

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

- **🔧 Lib Go (versionada via git tags):**
  - `@scouts/user-go`

- **🚀 Apps (versionados mas não publicados):**
  - `@scouts/bff-nest`
  - `@scouts/user-go-service`

### ⚙️ Configurações Aplicadas

1. **`nx.json`** - Configuração de release independente:
   ```json
   {
     "release": {
       "projectsRelationship": "independent",
       "releaseTagPattern": "{projectName}@v{version}",
       "projects": ["!@scouts/source"],
       "git": {
         "commit": true,
         "tag": true
       }
     }
   }
   ```

2. **`libs/user-go/project.json`** - Configuração específica para Go (agora 100% automática):
   ```json
   {
     "release": {
       "version": {
         "generator": "@nx/js:release-version",
         "generatorOptions": {
           "currentVersionResolver": "git-tag",
           "fallbackCurrentVersionResolver": "disk",
           "specifierSource": "conventional-commits"
         }
       }
     }
   }
   ```

3. **`libs/utils-nest/project.json`** e **`libs/user-node/project.json`** - Configuração para bibliotecas TypeScript:
   ```json
   {
     "release": {
       "version": {
         "generatorOptions": {
           "packageRoot": "dist/{projectRoot}",
           "currentVersionResolver": "git-tag",
           "fallbackCurrentVersionResolver": "disk"
         }
       }
     },
     "targets": {
       "nx-release-publish": {
         "options": {
           "packageRoot": "dist/{projectRoot}"
         }
       }
     }
   }
   ```

4. **`go.mod`** - Module paths corrigidos para GitHub:
   - `libs/user-go/go.mod`: `github.com/mateusmacedo/scouts/libs/user-go`
   - `apps/user-go-service/go.mod`: `github.com/mateusmacedo/scouts/apps/user-go-service`

## 🚀 Processo de Release

### 1. Validação Local (Opcional)

```bash
# Executar script de validação
./scripts/test-release.sh

# Ou executar comandos individuais com affected
pnpm nx affected -t lint test build --parallel=3
pnpm nx release --dry-run
```

**⚠️ Nota sobre `--dry-run`:**
- Nem todos os targets suportam `--dry-run`
- `format`, `biome`, `lint` com Biome/ESLint não suportam `--dry-run`
- `coverage` requer diretórios de output existentes
- Use sem `--dry-run` para execução real

**📋 Scripts Disponíveis no `package.json`:**
- `pnpm run lint` - Lint de todos os projetos
- `pnpm run build` - Build de todos os projetos  
- `pnpm run test` - Testes de todos os projetos
- `pnpm run ci` - Simula workflow de CI (lint + test + build)
- `pnpm run release` - Executa release completo

**🎯 Benefícios do affected:**
- ⚡ **Muito mais rápido** - Executa apenas projetos afetados
- 💰 **Reduz custos** - Menos tempo de CI
- 🎯 **Feedback mais rápido** - Desenvolvedores veem resultados mais cedo

### 2. Release Local Completo

```bash
# Aplicar versionamento automático via conventional commits
pnpm nx release --skip-publish

# Atualizar dependências Go
./scripts/update-go-dependencies.sh

# Publicar packages
pnpm nx release publish

# Push de mudanças e tags
git push origin main
git push --tags
```

**🔧 Target `nx-release-publish`:**
As bibliotecas TypeScript (`utils-nest` e `user-node`) utilizam o target `nx-release-publish` configurado para publicar no GitHub Package Registry com o `packageRoot` correto (`dist/{projectRoot}`).

### 3. Release via CI/CD (Recomendado)

#### 🎯 Trigger Manual (Novo Processo)

O release agora é executado **manualmente** via GitHub Actions UI para maior segurança:

1. **Acesse GitHub Actions** → Workflows → "Release"
2. **Clique em "Run workflow"**
3. **Configure os inputs:**
   - `dry-run`: true (padrão) para simular, false para release real
   - `version-specifier`: deixe vazio para auto via conventional commits
   - `skip-validation`: false (recomendado) para executar validações
4. **Execute o workflow**

#### 🔧 Workflows Configurados

- **`.github/workflows/ci.yml`** - CI otimizado para PRs (usa `nx affected`)
- **`.github/workflows/release.yml`** - **Release manual com validações completas**
- **`.github/workflows/release-dry-run.yml`** - Validação em PRs (usa `nx affected`)


**🚀 Otimizações implementadas:**
- ⚡ **CI 80% mais rápido** - Executa apenas projetos afetados
- 🎯 **Release inteligente** - Versiona apenas projetos com mudanças
- 💡 **Validação prévia** - Dry run em PRs antes do merge
- 🔒 **Release manual** - Previne publicações acidentais
- ✅ **Validação completa** - Script de consistência antes do release
- 📝 **GitHub Releases** - Integração automática com GitHub Releases

## 📋 Resultado Esperado

### 🏷️ Tags Git Criadas

```
@scouts/logger-node@v0.1.0
@scouts/utils-nest@v0.1.0
@scouts/user-node@v0.1.0
@scouts/user-go@v0.1.0
@scouts/bff-nest@v0.1.0
@scouts/user-go-service@v0.1.0
```

### 📦 Packages Publicados

- `@scouts/logger-node@0.1.0` → npm registry (npmjs.org)
- `@scouts/utils-nest@0.1.0` → npm registry (npmjs.org)
- `@scouts/user-node@0.1.0` → npm registry (npmjs.org)

### 📝 Changelogs Gerados

- `CHANGELOG.md` individual para cada projeto
- Workspace changelog desabilitado (Nx ignora em releases independentes)

## ✅ Validação Pós-Release

### 🏷️ Verificar Tags Git

```bash
git tag -l | grep v0.1.0
```

### 📦 Verificar Publicação TypeScript

```bash
# Verificar packages publicados
pnpm view @scouts/utils-nest
pnpm view @scouts/user-node

# Verificar se estão acessíveis
pnpm info @scouts/utils-nest
pnpm info @scouts/user-node
```

### 🔧 Verificar Go Module

```bash
cd apps/user-go-service
go list -m github.com/mateusmacedo/scouts/libs/user-go@v0.1.0
```

## 🔧 Troubleshooting

### ❌ Problema: Nx Release não executa

**✅ Solução:**
```bash
# Verificar se o Nx está instalado
pnpm nx --version

# Reinstalar dependências se necessário
pnpm install
```

### ❌ Problema: Erro de autenticação npm registry

**✅ Solução:**
1. Verificar se `.npmrc` está configurado corretamente
2. Verificar se `NODE_AUTH_TOKEN` está definido
3. Verificar permissões do token no npm

### ❌ Problema: Go modules não resolvem

**✅ Solução:**
1. Verificar se as tags foram criadas corretamente
2. Verificar se o module path está correto no go.mod
3. Executar `go mod tidy` no projeto dependente

## 🆕 Novo Processo de Release Manual

### 📋 Checklist Pré-Release

Antes de executar um release, execute localmente:

```bash
# 1. Validação completa de consistência
./scripts/validate-release-consistency.sh

# 2. Dry run do release
pnpm nx release --dry-run

# 3. Verificar se todos os testes passam
pnpm nx run-many -t test --parallel=3

# 4. Verificar se todos os projetos buildam
pnpm nx run-many -t build --parallel=3
```

### 🎯 Executando Release via GitHub Actions

1. **Acesse:** https://github.com/mateusmacedo/scouts/actions
2. **Selecione:** "Release" workflow
3. **Clique:** "Run workflow"
4. **Configure inputs:**
   - `dry-run`: `true` (primeira vez) ou `false` (release real)
   - `version-specifier`: deixe vazio para auto ou use `patch`/`minor`/`major`/`1.2.3`
   - `skip-validation`: `false` (recomendado)
5. **Execute** e monitore os logs

### 🔍 Validações Automáticas

O script `validate-release-consistency.sh` verifica:

- ✅ Mudanças não comitadas
- ✅ Sincronização de versões Go
- ✅ Build de todos os projetos
- ✅ Testes passando
- ✅ Linting OK
- ✅ Tags git não conflitantes
- ✅ Permissões de publicação
- ✅ CHANGELOGs atualizados
- ✅ Configuração Nx Release

### 🚨 Rollback Automático

Em caso de falha, o workflow executa rollback automático:
- Reverte commits de release
- Deleta tags criadas
- Notifica sobre a falha

## 🚀 Próximos Passos

1. **Release Notes** - ✅ Integrado com GitHub Releases
2. **Dependabot** - Configurar para atualizações automáticas
3. **Slack/Teams** - Notificações de release

## 🛠️ Scripts Úteis

- `./scripts/validate-release-consistency.sh` - **NOVO** Validação completa de consistência
- `./scripts/test-release.sh` - Validação completa da configuração
- `./scripts/update-go-dependencies.sh` - Atualização de dependências Go
- `./scripts/validate-release-setup.sh` - Validação detalhada do setup
- `./scripts/sync-go-versions.sh` - Sincronização de versões Go
- `pnpm nx release --help` - Ajuda do Nx Release

## 📖 Recursos Adicionais

- [Geradores Nx](NX_GENERATORS.md) - Como criar novos projetos
- [Nx Release Documentation](https://nx.dev/features/manage-releases)
- [npm Registry](https://docs.npmjs.com/about-npm)
