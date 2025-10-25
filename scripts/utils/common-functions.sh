#!/bin/bash

# Script com funções comuns reutilizáveis para scripts específicos
# Uso: source scripts/utils/common-functions.sh
# NOTA: Este script deve ser usado apenas para funcionalidades específicas
# que não duplicam funcionalidade nativa do Nx 20

# Cores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Funções de logging padronizadas
log_info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
log_success() { echo -e "${GREEN}✅ $*${NC}"; }
log_error() { echo -e "${RED}❌ $*${NC}" >&2; }
log_warning() { echo -e "${YELLOW}⚠️  $*${NC}"; }
log_debug() { echo -e "${PURPLE}🔍 $*${NC}"; }
log_step() { echo -e "${CYAN}🔄 $*${NC}"; }

# Função para validar pré-requisitos
validate_prerequisites() {
    local mode="${1:-strict}"  # strict ou soft
    local missing_tools=()
    
    # Verificar ferramentas essenciais
    command -v pnpm >/dev/null 2>&1 || missing_tools+=("pnpm")
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        if [ "$mode" = "strict" ]; then
            log_error "Ferramentas obrigatórias não encontradas: ${missing_tools[*]}"
            log_info "Instale as ferramentas necessárias e tente novamente"
            exit 1
        else
            log_warning "Ferramentas não encontradas: ${missing_tools[*]}"
            log_info "Funcionalidade limitada disponível"
        fi
    fi
    
    # Verificar se estamos no diretório raiz do workspace
    if [ ! -f "nx.json" ] || [ ! -f "package.json" ]; then
        log_error "Execute este script a partir do diretório raiz do workspace Nx"
        exit 1
    fi
    
    if [ "$mode" = "strict" ]; then
        log_success "Pré-requisitos validados"
    else
        log_info "Validação de pré-requisitos concluída (modo soft)"
    fi
}

# NOTA: Funções de retry foram removidas pois o Nx 20 tem retry nativo
# Use: nx run-many --target=test --parallel=3 (Nx gerencia retry automaticamente)

# Função para detectar se estamos em ambiente CI
is_ci_environment() {
    [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]
}

# Função para obter informações do workspace
get_workspace_info() {
    log_debug "Obtendo informações do workspace..."
    
    # Versões das ferramentas
    local node_version=$(node --version 2>/dev/null || echo "N/A")
    local pnpm_version=$(pnpm --version 2>/dev/null || echo "N/A")
    local nx_version=$(pnpm nx --version 2>/dev/null || echo "N/A")
    
    log_info "Node.js: $node_version"
    log_info "pnpm: $pnpm_version"
    log_info "Nx: $nx_version"
    
    # Informações do ambiente
    if is_ci_environment; then
        log_info "Ambiente: CI/CD"
    else
        log_info "Ambiente: Local"
    fi
}

# NOTA: Funções de cache foram removidas pois o Nx 20 gerencia cache automaticamente
# Use: nx reset (limpa cache) ou nx show projects (mostra informações do workspace)

# Função para calcular hash de arquivos
calculate_files_hash() {
    local files_pattern="$1"
    local exclude_pattern="$2"
    
    if [ -n "$exclude_pattern" ]; then
        find . -name "$files_pattern" -not -path "$exclude_pattern" -type f -exec md5sum {} \; | sort | md5sum | cut -d' ' -f1
    else
        find . -name "$files_pattern" -type f -exec md5sum {} \; | sort | md5sum | cut -d' ' -f1
    fi
}

# NOTA: Função de detecção de mudanças foi removida pois o Nx 20 tem nx affected
# Use: nx affected --target=test --base=origin/main

# Função para verificar labels de PR
check_pr_labels() {
    local force_go=false
    local force_node=false
    local force_all=false
    local skip_ci=false
    
    # Verificar se estamos em um PR do GitHub
    if [ "$GITHUB_EVENT_NAME" = "pull_request" ] && [ -n "$GITHUB_TOKEN" ]; then
        log_debug "Verificando labels do PR..."
        
        # Esta função seria implementada com GitHub API
        # Por enquanto, retorna valores padrão
        log_info "Labels do PR não implementados ainda"
    fi
    
    echo "force-go=$force_go"
    echo "force-node=$force_node"
    echo "force-all=$force_all"
    echo "skip-ci=$skip_ci"
}

# Função para verificar commit messages
check_commit_messages() {
    local commit_message="${1:-$GITHUB_HEAD_COMMIT_MESSAGE}"
    local force_go=false
    local force_node=false
    local force_all=false
    local skip_ci=false
    
    if [ -n "$commit_message" ]; then
        case "$commit_message" in
            *"[ci go]"*|*"[ci:go]"*)
                force_go=true
                log_info "Commit message indica forçar Go: $commit_message"
                ;;
            *"[ci node]"*|*"[ci:node]"*)
                force_node=true
                log_info "Commit message indica forçar Node.js: $commit_message"
                ;;
            *"[ci full]"*|*"[ci:full]"*)
                force_all=true
                log_info "Commit message indica forçar tudo: $commit_message"
                ;;
            *"[skip ci]"*|*"[ci skip]"*)
                skip_ci=true
                log_info "Commit message indica pular CI: $commit_message"
                ;;
        esac
    fi
    
    echo "force-go=$force_go"
    echo "force-node=$force_node"
    echo "force-all=$force_all"
    echo "skip-ci=$skip_ci"
}

# NOTA: Funções de paralelização e health check foram removidas pois não são padrão Nx 20
# Use: nx run-many --target=test --parallel=3 (Nx gerencia paralelização automaticamente)

# Função para mostrar estatísticas de performance
show_performance_stats() {
    local start_time="$1"
    local end_time="$2"
    local operation="$3"
    
    if [ -n "$start_time" ] && [ -n "$end_time" ]; then
        local duration=$((end_time - start_time))
        log_success "$operation concluído em ${duration}s"
    fi
}

# Exportar funções para uso em outros scripts
export -f log_info log_success log_error log_warning log_debug log_step
export -f validate_prerequisites is_ci_environment get_workspace_info
export -f calculate_files_hash check_pr_labels check_commit_messages
export -f show_performance_stats
