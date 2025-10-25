#!/bin/bash

# Script para validar integridade de cache
# Uso: ./scripts/utils/validate-cache-integrity.sh [cache_type] [cache_path]

set -e

# Carregar funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common-functions.sh"

# Parâmetros
CACHE_TYPE="${1:-all}"  # pnpm, nx, go, coverage, all
CACHE_PATH="${2:-}"
AUTO_CLEANUP="${3:-false}"

log_info "Validando integridade de cache: $CACHE_TYPE"
log_debug "Auto cleanup: $AUTO_CLEANUP"

# Validar pré-requisitos
validate_prerequisites

# Função para validar cache pnpm
validate_pnpm_cache() {
    local cache_path="${1:-$HOME/.pnpm-store}"
    log_step "Validando cache pnpm em $cache_path"
    
    if [ ! -d "$cache_path" ]; then
        log_warning "Cache pnpm não encontrado em $cache_path"
        return 1
    fi
    
    # Verificar estrutura do cache pnpm
    local required_dirs=("registry.npmjs.org" "github.com")
    local valid=true
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$cache_path/$dir" ]; then
            log_warning "Diretório obrigatório não encontrado: $dir"
            valid=false
        fi
    done
    
    # Verificar se há arquivos corrompidos
    local corrupted_files=$(find "$cache_path" -name "*.tmp" -o -name "*.lock" 2>/dev/null | wc -l)
    if [ "$corrupted_files" -gt 0 ]; then
        log_warning "$corrupted_files arquivos temporários encontrados no cache pnpm"
        if [ "$AUTO_CLEANUP" = "true" ]; then
            find "$cache_path" -name "*.tmp" -o -name "*.lock" -delete
            log_info "Arquivos temporários removidos"
        fi
    fi
    
    if [ "$valid" = "true" ]; then
        log_success "Cache pnpm válido"
        return 0
    else
        log_error "Cache pnpm inválido"
        return 1
    fi
}

# Função para validar cache Nx
validate_nx_cache() {
    local cache_path="${1:-.nx/cache}"
    log_step "Validando cache Nx em $cache_path"
    
    if [ ! -d "$cache_path" ]; then
        log_warning "Cache Nx não encontrado em $cache_path"
        return 1
    fi
    
    # Verificar arquivo de índice do cache
    if [ ! -f "$cache_path/cache.json" ]; then
        log_warning "Arquivo de índice do cache Nx não encontrado"
        return 1
    fi
    
    # Verificar se o arquivo de índice é válido JSON
    if ! jq empty "$cache_path/cache.json" 2>/dev/null; then
        log_error "Arquivo de índice do cache Nx corrompido"
        if [ "$AUTO_CLEANUP" = "true" ]; then
            rm -f "$cache_path/cache.json"
            log_info "Arquivo de índice corrompido removido"
        fi
        return 1
    fi
    
    # Verificar tamanho do cache
    local cache_size=$(du -sh "$cache_path" 2>/dev/null | cut -f1)
    log_info "Tamanho do cache Nx: $cache_size"
    
    # Verificar se há entradas válidas
    local entry_count=$(jq 'keys | length' "$cache_path/cache.json" 2>/dev/null || echo "0")
    if [ "$entry_count" -gt 0 ]; then
        log_success "Cache Nx válido ($entry_count entradas)"
        return 0
    else
        log_warning "Cache Nx vazio"
        return 1
    fi
}

# Função para validar cache Go
validate_go_cache() {
    local cache_path="${1:-$HOME/.cache/go-build}"
    log_step "Validando cache Go em $cache_path"
    
    if [ ! -d "$cache_path" ]; then
        log_warning "Cache Go não encontrado em $cache_path"
        return 1
    fi
    
    # Verificar estrutura do cache Go
    if [ ! -d "$cache_path/pkg" ]; then
        log_warning "Diretório pkg não encontrado no cache Go"
        return 1
    fi
    
    # Verificar se há arquivos válidos
    local go_files=$(find "$cache_path" -name "*.a" 2>/dev/null | wc -l)
    if [ "$go_files" -gt 0 ]; then
        log_success "Cache Go válido ($go_files arquivos .a)"
        return 0
    else
        log_warning "Cache Go vazio ou inválido"
        return 1
    fi
}

# Função para validar cache de coverage
validate_coverage_cache() {
    local cache_path="${1:-$HOME/.cache/coverage}"
    log_step "Validando cache de coverage em $cache_path"
    
    if [ ! -d "$cache_path" ]; then
        log_warning "Cache de coverage não encontrado em $cache_path"
        return 1
    fi
    
    # Verificar se há arquivos de cache válidos
    local cache_files=$(find "$cache_path" -name "coverage-*.tar.gz" 2>/dev/null | wc -l)
    if [ "$cache_files" -gt 0 ]; then
        log_success "Cache de coverage válido ($cache_files arquivos)"
        return 0
    else
        log_warning "Cache de coverage vazio"
        return 1
    fi
}

# Função para limpar cache corrompido
cleanup_corrupted_cache() {
    local cache_type="$1"
    local cache_path="$2"
    
    log_warning "Limpando cache corrompido: $cache_type"
    
    case "$cache_type" in
        "pnpm")
            rm -rf "$cache_path"
            log_info "Cache pnpm removido"
            ;;
        "nx")
            rm -rf "$cache_path"
            log_info "Cache Nx removido"
            ;;
        "go")
            rm -rf "$cache_path"
            log_info "Cache Go removido"
            ;;
        "coverage")
            rm -rf "$cache_path"
            log_info "Cache de coverage removido"
            ;;
    esac
}

# Executar validações baseadas no tipo
case "$CACHE_TYPE" in
    "pnpm")
        if validate_pnpm_cache "$CACHE_PATH"; then
            echo "pnpm-valid=true"
        else
            echo "pnpm-valid=false"
            if [ "$AUTO_CLEANUP" = "true" ]; then
                cleanup_corrupted_cache "pnpm" "${CACHE_PATH:-$HOME/.pnpm-store}"
            fi
        fi
        ;;
        
    "nx")
        if validate_nx_cache "$CACHE_PATH"; then
            echo "nx-valid=true"
        else
            echo "nx-valid=false"
            if [ "$AUTO_CLEANUP" = "true" ]; then
                cleanup_corrupted_cache "nx" "${CACHE_PATH:-.nx/cache}"
            fi
        fi
        ;;
        
    "go")
        if validate_go_cache "$CACHE_PATH"; then
            echo "go-valid=true"
        else
            echo "go-valid=false"
            if [ "$AUTO_CLEANUP" = "true" ]; then
                cleanup_corrupted_cache "go" "${CACHE_PATH:-$HOME/.cache/go-build}"
            fi
        fi
        ;;
        
    "coverage")
        if validate_coverage_cache "$CACHE_PATH"; then
            echo "coverage-valid=true"
        else
            echo "coverage-valid=false"
            if [ "$AUTO_CLEANUP" = "true" ]; then
                cleanup_corrupted_cache "coverage" "${CACHE_PATH:-$HOME/.cache/coverage}"
            fi
        fi
        ;;
        
    "all")
        local all_valid=true
        
        # Validar todos os tipos de cache
        if ! validate_pnpm_cache; then
            all_valid=false
            echo "pnpm-valid=false"
        else
            echo "pnpm-valid=true"
        fi
        
        if ! validate_nx_cache; then
            all_valid=false
            echo "nx-valid=false"
        else
            echo "nx-valid=true"
        fi
        
        if ! validate_go_cache; then
            all_valid=false
            echo "go-valid=false"
        else
            echo "go-valid=true"
        fi
        
        if ! validate_coverage_cache; then
            all_valid=false
            echo "coverage-valid=false"
        else
            echo "coverage-valid=true"
        fi
        
        if [ "$all_valid" = "true" ]; then
            log_success "Todos os caches são válidos"
            echo "all-valid=true"
        else
            log_warning "Alguns caches são inválidos"
            echo "all-valid=false"
        fi
        ;;
        
    *)
        log_error "Tipo de cache inválido: $CACHE_TYPE"
        log_info "Tipos suportados: pnpm, nx, go, coverage, all"
        exit 1
        ;;
esac

log_success "Validação de integridade de cache concluída"
