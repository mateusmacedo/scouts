#!/bin/bash

# Script para cache inteligente de resultados de coverage
# Uso: ./scripts/utils/cache-coverage-results.sh [action] [language] [cache_key]

set -e

# Carregar funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common-functions.sh"

# Parâmetros
ACTION="${1:-restore}"  # restore, save, cleanup
LANGUAGE="${2:-all}"    # node, go, all
CACHE_KEY="${3:-coverage-$(date +%Y%m%d)}"
CACHE_DIR="${4:-~/.cache/coverage}"

# Expandir cache dir
CACHE_DIR="${CACHE_DIR/#\~/$HOME}"

log_info "Cache de coverage: $ACTION para $LANGUAGE"
log_debug "Cache key: $CACHE_KEY"
log_debug "Cache dir: $CACHE_DIR"

# Validar pré-requisitos
validate_prerequisites

# Criar diretório de cache se não existir
mkdir -p "$CACHE_DIR"

case "$ACTION" in
    "restore")
        log_step "Restaurando cache de coverage..."
        
        # Verificar se cache existe
        if [ -f "$CACHE_DIR/$CACHE_KEY.tar.gz" ]; then
            log_info "Cache encontrado: $CACHE_KEY"
            
            # Extrair cache
            if tar -xzf "$CACHE_DIR/$CACHE_KEY.tar.gz" -C .; then
                log_success "Cache de coverage restaurado"
                
                # Verificar integridade dos arquivos
                local coverage_files_found=0
                case "$LANGUAGE" in
                    "node"|"all")
                        if [ -d "coverage" ] && [ -f "coverage/lcov.info" ]; then
                            coverage_files_found=$((coverage_files_found + 1))
                        fi
                        ;;
                    "go"|"all")
                        if [ -d "coverage/go" ] && [ -f "coverage/go/go-coverage.out" ]; then
                            coverage_files_found=$((coverage_files_found + 1))
                        fi
                        ;;
                esac
                
                if [ $coverage_files_found -gt 0 ]; then
                    log_success "Cache de coverage válido ($coverage_files_found arquivos encontrados)"
                    echo "cache-hit=true"
                else
                    log_warning "Cache de coverage vazio ou corrompido"
                    echo "cache-hit=false"
                fi
            else
                log_error "Falha ao extrair cache de coverage"
                echo "cache-hit=false"
            fi
        else
            log_info "Cache de coverage não encontrado"
            echo "cache-hit=false"
        fi
        ;;
        
    "save")
        log_step "Salvando cache de coverage..."
        
        # Verificar se há arquivos de coverage para salvar
        local files_to_cache=()
        
        case "$LANGUAGE" in
            "node")
                if [ -d "coverage" ]; then
                    files_to_cache+=("coverage")
                fi
                ;;
            "go")
                if [ -d "coverage/go" ]; then
                    files_to_cache+=("coverage/go")
                fi
                ;;
            "all")
                if [ -d "coverage" ]; then
                    files_to_cache+=("coverage")
                fi
                ;;
        esac
        
        if [ ${#files_to_cache[@]} -eq 0 ]; then
            log_warning "Nenhum arquivo de coverage encontrado para salvar"
            echo "cache-saved=false"
            exit 0
        fi
        
        # Criar arquivo de cache
        if tar -czf "$CACHE_DIR/$CACHE_KEY.tar.gz" "${files_to_cache[@]}"; then
            log_success "Cache de coverage salvo: $CACHE_KEY"
            echo "cache-saved=true"
            
            # Mostrar estatísticas do cache
            local cache_size=$(du -h "$CACHE_DIR/$CACHE_KEY.tar.gz" | cut -f1)
            log_info "Tamanho do cache: $cache_size"
        else
            log_error "Falha ao salvar cache de coverage"
            echo "cache-saved=false"
        fi
        ;;
        
    "cleanup")
        log_step "Limpando cache de coverage antigo..."
        
        # Remover caches mais antigos que 7 dias
        local cutoff_date=$(date -d '7 days ago' +%Y%m%d)
        local removed_count=0
        
        for cache_file in "$CACHE_DIR"/coverage-*.tar.gz; do
            if [ -f "$cache_file" ]; then
                local file_date=$(basename "$cache_file" | grep -o '[0-9]\{8\}' || echo "00000000")
                if [ "$file_date" -lt "$cutoff_date" ]; then
                    rm -f "$cache_file"
                    removed_count=$((removed_count + 1))
                    log_debug "Removido: $(basename "$cache_file")"
                fi
            fi
        done
        
        log_success "Cache cleanup concluído: $removed_count arquivos removidos"
        ;;
        
    "list")
        log_step "Listando caches de coverage disponíveis..."
        
        if [ -d "$CACHE_DIR" ]; then
            local cache_files=($(ls -la "$CACHE_DIR"/coverage-*.tar.gz 2>/dev/null || true))
            
            if [ ${#cache_files[@]} -gt 0 ]; then
                log_info "Caches disponíveis:"
                for cache_file in "${cache_files[@]}"; do
                    local file_size=$(du -h "$cache_file" | cut -f1)
                    local file_date=$(stat -c %y "$cache_file" 2>/dev/null || echo "N/A")
                    log_info "  $(basename "$cache_file") - $file_size - $file_date"
                done
            else
                log_info "Nenhum cache de coverage encontrado"
            fi
        else
            log_info "Diretório de cache não existe"
        fi
        ;;
        
    *)
        log_error "Ação inválida: $ACTION"
        log_info "Ações suportadas: restore, save, cleanup, list"
        exit 1
        ;;
esac

log_success "Operação de cache de coverage concluída"
