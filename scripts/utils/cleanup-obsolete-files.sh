#!/bin/bash

# Script para limpeza de arquivos obsoletos/legados/temporários
# Uso: ./scripts/utils/cleanup-obsolete-files.sh [--dry-run] [--force]

set -e

# Carregar funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common-functions.sh"

# Parâmetros
DRY_RUN=false
FORCE=false

# Processar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            log_error "Argumento desconhecido: $1"
            log_info "Uso: $0 [--dry-run] [--force]"
            exit 1
            ;;
    esac
done

log_info "🧹 Iniciando limpeza de arquivos obsoletos..."
log_info "Modo dry-run: $DRY_RUN"
log_info "Modo force: $FORCE"

# Função para remover arquivo/diretório
remove_file() {
    local path="$1"
    local description="$2"
    
    if [ -e "$path" ]; then
        if [ "$DRY_RUN" = "true" ]; then
            log_info "DRY-RUN: Removeria $description: $path"
        else
            log_step "Removendo $description: $path"
            rm -rf "$path"
            log_success "$description removido"
        fi
    else
        log_debug "$description não encontrado: $path"
    fi
}

# 1. Scripts consolidados
log_step "1. Removendo scripts consolidados..."
remove_file "scripts/cleanup-coverage.js" "Script de limpeza de coverage (consolidado)"

# 2. Cache temporário
log_step "2. Limpando cache temporário..."
remove_file ".nx/cache" "Cache do Nx"
remove_file "node_modules" "Node modules (será reinstalado)"
remove_file "~/.pnpm-store" "Cache do pnpm"
remove_file "~/.pnpm-cache" "Cache do pnpm"

# 3. Coverage antigo
log_step "3. Limpando coverage antigo..."
if [ -d "coverage" ]; then
    # Manter apenas consolidated
    find coverage -type f -name "*.lcov" -not -path "*/consolidated/*" -exec rm -f {} \; 2>/dev/null || true
    find coverage -type d -empty -delete 2>/dev/null || true
    log_success "Coverage antigo limpo (mantendo consolidated)"
fi

# 4. Builds antigos
log_step "4. Limpando builds antigos..."
remove_file "dist" "Diretório de build (será regenerado)"

# 5. Arquivos temporários
log_step "5. Limpando arquivos temporários..."
remove_file "tmp" "Diretório temporário"

# 6. Logs antigos
log_step "6. Limpando logs antigos..."
remove_file "draft/logs" "Logs de teste antigos"

# 7. Arquivos de debug
log_step "7. Limpando arquivos de debug..."
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*.lock" -type f -delete 2>/dev/null || true

# 8. Arquivos de coverage individual
log_step "8. Limpando arquivos de coverage individual..."
find . -name "coverage.out" -type f -delete 2>/dev/null || true
find . -name "lcov.info" -not -path "*/consolidated/*" -type f -delete 2>/dev/null || true

# 9. Arquivos de teste temporários
log_step "9. Limpando arquivos de teste temporários..."
find . -name "*.test.log" -type f -delete 2>/dev/null || true
find . -name "test-results" -type d -exec rm -rf {} \; 2>/dev/null || true

# 10. Arquivos de cache do sistema
log_step "10. Limpando cache do sistema..."
if [ -d "$HOME/.cache" ]; then
    find "$HOME/.cache" -name "*coverage*" -type d -exec rm -rf {} \; 2>/dev/null || true
    find "$HOME/.cache" -name "*nx*" -type d -exec rm -rf {} \; 2>/dev/null || true
fi

# Resumo
log_success "🧹 Limpeza de arquivos obsoletos concluída!"

if [ "$DRY_RUN" = "true" ]; then
    log_info "Modo dry-run ativado - nenhum arquivo foi removido"
    log_info "Execute sem --dry-run para remover os arquivos"
else
    log_info "Arquivos obsoletos removidos com sucesso"
    log_info "Cache será regenerado automaticamente no próximo build"
fi

# Mostrar espaço liberado
if command -v du >/dev/null 2>&1; then
    log_info "📊 Espaço em disco atual:"
    du -sh . 2>/dev/null || true
fi
