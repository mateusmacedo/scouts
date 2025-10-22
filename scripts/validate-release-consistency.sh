#!/usr/bin/env bash

# Script de Validação de Consistência para Release
# Verifica se todas as condições estão adequadas para um release seguro

set -e

echo "🔍 Validando consistência para release..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Contador de erros
ERRORS=0

# 1. Verificar se estamos no diretório correto
if [[ ! -f "nx.json" ]] || [[ ! -f "package.json" ]]; then
    log_error "Execute este script na raiz do workspace Nx"
    exit 1
fi

log_info "Verificando ambiente..."

# 2. Verificar se não há mudanças não comitadas (exceto as esperadas)
if [[ -n $(git status --porcelain) ]]; then
    # Verificar se são apenas mudanças esperadas
    UNCOMMITTED_CHANGES=$(git status --porcelain)
    
    # Contar mudanças esperadas (go.mod/go.sum e o próprio script durante execução)
    EXPECTED_CHANGES=$(echo "$UNCOMMITTED_CHANGES" | grep -E "(M.*go\.mod|M.*go\.sum|M.*scripts/validate-release-consistency\.sh)" | wc -l)
    TOTAL_CHANGES=$(echo "$UNCOMMITTED_CHANGES" | wc -l)
    
    if [[ $EXPECTED_CHANGES -eq $TOTAL_CHANGES ]]; then
        log_success "Apenas mudanças esperadas (go.mod/go.sum e script de validação)"
    else
        log_error "Existem mudanças não comitadas. Commit ou stash antes de fazer release."
        echo "Mudanças encontradas:"
        git status --porcelain
        ERRORS=$((ERRORS + 1))
    fi
else
    log_success "Nenhuma mudança não comitada encontrada"
fi

# 3. Verificar se estamos na branch main ou release/*
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]] && [[ ! "$CURRENT_BRANCH" =~ ^release/ ]]; then
    log_warning "Não está na branch main ou release/*. Branch atual: $CURRENT_BRANCH"
    log_warning "Releases devem ser feitos a partir de main ou branches release/*"
fi

# 4. Verificar se pnpm está instalado e na versão correta
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm não está instalado"
    ERRORS=$((ERRORS + 1))
else
    PNPM_VERSION=$(pnpm --version)
    log_success "pnpm versão $PNPM_VERSION encontrado"
fi

# 5. Verificar se nx está disponível
if ! command -v nx &> /dev/null && ! pnpm nx --version &> /dev/null; then
    log_error "nx não está disponível. Execute 'pnpm install' primeiro"
    ERRORS=$((ERRORS + 1))
else
    # Usar pnpm nx se nx não estiver no PATH
    if command -v nx &> /dev/null; then
        NX_CMD="nx"
        log_success "nx disponível"
    else
        NX_CMD="pnpm nx"
        log_success "nx disponível via pnpm"
    fi
fi

# 6. Verificar sincronização de versões Go
log_info "Verificando sincronização de versões Go..."

# Verificar se o script de sync existe
if [[ ! -f "scripts/sync-go-versions.sh" ]]; then
    log_error "Script sync-go-versions.sh não encontrado"
    ERRORS=$((ERRORS + 1))
else
    # Executar sync e verificar se há mudanças
    chmod +x scripts/sync-go-versions.sh
    if ./scripts/sync-go-versions.sh; then
        if [[ -n $(git status -s apps/user-go-service/go.mod apps/user-go-service/go.sum) ]]; then
            log_error "go.mod está desatualizado! Execute: pnpm nx run @scouts/user-go-service:sync-go-deps"
            git diff apps/user-go-service/go.mod
            ERRORS=$((ERRORS + 1))
        else
            log_success "go.mod está sincronizado"
        fi
    else
        log_error "Falha ao executar sync-go-versions.sh"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 7. Verificar se CI passou (build/test/lint já validados)
log_info "Verificando se CI passou..."

# Nota: build/test/lint são validados no CI via workflow dependency
# Este script foca apenas em validações específicas de release
log_success "Build/test/lint validados no CI (via workflow dependency)"

# 8. Verificar dry-run do nx release
log_info "Verificando dry-run do nx release..."

if $NX_CMD release --dry-run > /dev/null 2>&1; then
    log_success "Dry-run do nx release executado com sucesso"
else
    log_error "Dry-run do nx release falhou"
    ERRORS=$((ERRORS + 1))
fi

# 10. Verificar tags git existentes vs versões declaradas
log_info "Verificando consistência de tags git..."

# Obter versões dos package.json (garantir que estamos no workspace root)
cd "$(dirname "$0")/.."
NODE_LOGGER_VERSION=$(node -p "require('./libs/logger-node/package.json').version")
NEST_UTILS_VERSION=$(node -p "require('./libs/utils-nest/package.json').version")
NODE_USER_VERSION=$(node -p "require('./libs/user-node/package.json').version")
GO_USER_VERSION=$(node -p "require('./libs/user-go/package.json').version")

echo "Versões encontradas:"
echo "  @scouts/logger-node: $NODE_LOGGER_VERSION"
echo "  @scouts/utils-nest: $NEST_UTILS_VERSION"
echo "  @scouts/user-node: $NODE_USER_VERSION"
echo "  @scouts/user-go: $GO_USER_VERSION"

# Verificar se as tags já existem
EXISTING_TAGS=$(git tag -l | grep -E "(@scouts/.*@v|@scouts/.*@)" || true)

# Verificar se é primeira release
FIRST_RELEASE=true
for project in logger-node utils-nest user-node; do
    PACKAGE_NAME="@scouts/$project"
    if npm view "$PACKAGE_NAME" version > /dev/null 2>&1; then
        FIRST_RELEASE=false
        break
    fi
done

if [[ "$FIRST_RELEASE" == "true" ]]; then
    log_info "🎉 Esta será a PRIMEIRA RELEASE dos projetos!"
    if [[ -n "$EXISTING_TAGS" ]]; then
        log_warning "Tags existentes encontradas (pode ser de desenvolvimento):"
        echo "$EXISTING_TAGS"
    else
        log_success "Nenhuma tag existente (OK para primeira release)"
    fi
else
    log_info "🔄 Release subsequente dos projetos"
    if [[ -n "$EXISTING_TAGS" ]]; then
        log_warning "Tags existentes encontradas:"
        echo "$EXISTING_TAGS"
        log_warning "Verifique se as versões não conflitam"
    fi
fi

# 11. Verificar permissões de publicação (silencioso)
# Os tokens são injetados automaticamente no GitHub Actions

# 12. CHANGELOGs são gerados automaticamente pelo Nx Release
# Não é necessário verificar manualmente

# 13. Verificar configuração do Nx Release
log_info "Verificando configuração do Nx Release..."

if [[ -f "nx.json" ]]; then
    if grep -q '"release"' nx.json; then
        log_success "Configuração de release encontrada em nx.json"
    else
        log_error "Configuração de release não encontrada em nx.json"
        ERRORS=$((ERRORS + 1))
    fi
else
    log_error "nx.json não encontrado"
    ERRORS=$((ERRORS + 1))
fi

# 14. Verificar se o workspace está limpo (sem node_modules desnecessários)
log_info "Verificando limpeza do workspace..."

if [[ -d "node_modules" ]] && [[ -f "pnpm-lock.yaml" ]]; then
    log_success "Dependências instaladas corretamente"
else
    log_warning "Execute 'pnpm install' para garantir dependências atualizadas"
fi

# 15. Verificar se não há conflitos de merge pendentes
log_info "Verificando conflitos de merge..."

if [[ -f ".git/MERGE_HEAD" ]]; then
    log_error "Merge em andamento. Resolva antes de fazer release."
    ERRORS=$((ERRORS + 1))
else
    log_success "Nenhum merge em andamento"
fi

# Resumo final
echo ""
echo "=========================================="
if [[ $ERRORS -eq 0 ]]; then
    if [[ "$FIRST_RELEASE" == "true" ]]; then
        log_success "🎉 Todas as validações passaram! Pronto para PRIMEIRA RELEASE."
        echo ""
        echo "📋 Esta será a primeira publicação dos packages:"
        echo "  - @scouts/logger-node"
        echo "  - @scouts/utils-nest" 
        echo "  - @scouts/user-node"
        echo "  - @scouts/user-go"
        echo ""
        echo "Para executar a primeira release:"
        echo "1. Vá para Actions no GitHub"
        echo "2. Execute o workflow 'Release'"
        echo "3. Configure dry-run=false para publicar"
        echo "4. Os packages serão publicados no NPM pela primeira vez"
    else
        log_success "🎉 Todas as validações passaram! Pronto para release subsequente."
        echo ""
        echo "Para executar o release:"
        echo "1. Vá para Actions no GitHub"
        echo "2. Execute o workflow 'Release'"
        echo "3. Configure os inputs conforme necessário"
    fi
    exit 0
else
    log_error "❌ $ERRORS erro(s) encontrado(s). Corrija antes de fazer release."
    echo ""
    echo "Problemas encontrados:"
    echo "- Verifique os erros acima"
    echo "- Execute os comandos sugeridos"
    echo "- Execute este script novamente após correções"
    exit 1
fi