#!/bin/bash

# Script com funções comuns reutilizáveis para todos os scripts
# Uso: source scripts/utils/common-functions.sh

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
    local missing_tools=()
    
    # Verificar ferramentas essenciais
    command -v pnpm >/dev/null 2>&1 || missing_tools+=("pnpm")
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Ferramentas obrigatórias não encontradas: ${missing_tools[*]}"
        log_info "Instale as ferramentas necessárias e tente novamente"
        exit 1
    fi
    
    # Verificar se estamos no diretório raiz do workspace
    if [ ! -f "nx.json" ] || [ ! -f "package.json" ]; then
        log_error "Execute este script a partir do diretório raiz do workspace Nx"
        exit 1
    fi
    
    log_success "Pré-requisitos validados"
}

# Função para executar comando com retry inteligente
execute_with_retry() {
    local max_attempts=${1:-3}
    local base_delay=${2:-5}
    local jitter_max=${3:-2}
    local retryable_patterns=${4:-"ECONNRESET|ETIMEDOUT|ENOTFOUND|Network error|Timeout|Connection refused"}
    shift 4
    local command="$*"
    
    log_step "Executando: $command"
    log_info "Máximo de tentativas: $max_attempts, Delay base: ${base_delay}s, Jitter: ${jitter_max}s"
    
    local attempt=1
    local delay=$base_delay
    
    while [ $attempt -le $max_attempts ]; do
        log_debug "Tentativa $attempt/$max_attempts"
        
        # Executar comando e capturar output
        local output
        local exit_code
        
        if output=$(eval "$command" 2>&1); then
            log_success "Comando executado com sucesso na tentativa $attempt"
            return 0
        else
            exit_code=$?
            log_warning "Tentativa $attempt falhou com código $exit_code"
            
            # Verificar se o erro é retriável
            if echo "$output" | grep -qE "$retryable_patterns"; then
                log_info "Erro retriável detectado: $(echo "$output" | grep -E "$retryable_patterns" | head -1)"
            else
                log_error "Erro não retriável detectado: $(echo "$output" | head -1)"
                return $exit_code
            fi
            
            # Se não é a última tentativa, calcular delay com jitter
            if [ $attempt -lt $max_attempts ]; then
                # Exponential backoff com jitter
                local jitter=$((RANDOM % jitter_max + 1))
                local actual_delay=$((delay + jitter))
                
                log_warning "Aguardando ${actual_delay}s antes da próxima tentativa (base: ${delay}s + jitter: ${jitter}s)..."
                sleep $actual_delay
                
                # Próximo delay (exponential backoff)
                delay=$((delay * 2))
                attempt=$((attempt + 1))
            else
                log_error "Todas as $max_attempts tentativas falharam"
                log_error "Último erro: $output"
                return $exit_code
            fi
        fi
    done
}

# Função para executar com retry específico por tipo de task
execute_task_with_retry() {
    local task_type="$1"
    local max_attempts="$2"
    local base_delay="$3"
    shift 3
    local command="$*"
    
    # Configurações específicas por tipo de task
    case "$task_type" in
        "test")
            local retryable_patterns="ECONNRESET|ETIMEDOUT|ENOTFOUND|Network error|Timeout|Connection refused|Test timeout|Jest timeout"
            local jitter_max=3
            ;;
        "build")
            local retryable_patterns="ECONNRESET|ETIMEDOUT|ENOTFOUND|Network error|Timeout|Connection refused|Build timeout|Compilation timeout"
            local jitter_max=5
            ;;
        "coverage")
            local retryable_patterns="ECONNRESET|ETIMEDOUT|ENOTFOUND|Network error|Timeout|Connection refused|Coverage timeout|Report generation failed"
            local jitter_max=2
            ;;
        "lint")
            local retryable_patterns="ECONNRESET|ETIMEDOUT|ENOTFOUND|Network error|Timeout|Connection refused|Lint timeout"
            local jitter_max=1
            ;;
        *)
            local retryable_patterns="ECONNRESET|ETIMEDOUT|ENOTFOUND|Network error|Timeout|Connection refused"
            local jitter_max=2
            ;;
    esac
    
    log_info "Executando task $task_type com retry específico"
    execute_with_retry "$max_attempts" "$base_delay" "$jitter_max" "$retryable_patterns" "$command"
}

# Função para executar com circuit breaker
execute_with_circuit_breaker() {
    local max_failures=${1:-5}
    local reset_timeout=${2:-300}  # 5 minutos
    local command="$2"
    shift 2
    
    local circuit_file="/tmp/circuit_breaker_$(echo "$command" | md5sum | cut -d' ' -f1)"
    local current_time=$(date +%s)
    
    # Verificar se o circuit breaker está aberto
    if [ -f "$circuit_file" ]; then
        local last_failure=$(cat "$circuit_file")
        local time_since_failure=$((current_time - last_failure))
        
        if [ $time_since_failure -lt $reset_timeout ]; then
            log_warning "Circuit breaker aberto. Aguardando $((reset_timeout - time_since_failure))s antes de tentar novamente"
            return 1
        else
            log_info "Circuit breaker resetado, removendo arquivo de controle"
            rm -f "$circuit_file"
        fi
    fi
    
    # Executar comando
    if eval "$command"; then
        log_success "Comando executado com sucesso"
        # Remover arquivo de circuit breaker se existir
        rm -f "$circuit_file"
        return 0
    else
        local exit_code=$?
        log_warning "Comando falhou com código $exit_code"
        
        # Registrar falha
        echo "$current_time" > "$circuit_file"
        
        # Verificar se deve abrir o circuit breaker
        local failure_count=1
        if [ -f "${circuit_file}_count" ]; then
            failure_count=$(cat "${circuit_file}_count")
            failure_count=$((failure_count + 1))
        fi
        
        echo "$failure_count" > "${circuit_file}_count"
        
        if [ $failure_count -ge $max_failures ]; then
            log_error "Circuit breaker aberto após $failure_count falhas consecutivas"
            log_error "Aguardando $reset_timeout segundos antes de permitir novas tentativas"
        fi
        
        return $exit_code
    fi
}

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

# Função para validar integridade de cache
validate_cache_integrity() {
    local cache_path="$1"
    local cache_type="$2"
    
    if [ -z "$cache_path" ] || [ -z "$cache_type" ]; then
        log_error "Parâmetros de cache inválidos"
        return 1
    fi
    
    log_step "Validando integridade do cache $cache_type em $cache_path"
    
    if [ ! -d "$cache_path" ]; then
        log_warning "Cache $cache_type não encontrado em $cache_path"
        return 1
    fi
    
    # Verificar se o cache não está corrompido
    case "$cache_type" in
        "pnpm")
            if [ -f "$cache_path/registry.npmjs.org" ]; then
                log_success "Cache pnpm válido"
                return 0
            fi
            ;;
        "nx")
            if [ -f "$cache_path/cache.json" ]; then
                log_success "Cache Nx válido"
                return 0
            fi
            ;;
        "go")
            if [ -d "$cache_path/pkg" ]; then
                log_success "Cache Go válido"
                return 0
            fi
            ;;
        *)
            log_warning "Tipo de cache desconhecido: $cache_type"
            return 1
            ;;
    esac
    
    log_warning "Cache $cache_type pode estar corrompido"
    return 1
}

# Função para limpar cache corrompido
cleanup_corrupted_cache() {
    local cache_path="$1"
    local cache_type="$2"
    
    log_warning "Removendo cache corrompido: $cache_type em $cache_path"
    
    if [ -d "$cache_path" ]; then
        rm -rf "$cache_path"
        log_success "Cache $cache_type removido"
    fi
}

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

# Função para detectar mudanças por linguagem
detect_language_changes() {
    local base_ref="${1:-HEAD~1}"
    local go_changed=false
    local node_changed=false
    local config_changed=false
    
    log_step "Detectando mudanças por linguagem desde $base_ref"
    
    # Detectar mudanças em Go
    if git diff --name-only "$base_ref" | grep -E '\.(go|mod|sum)$' >/dev/null; then
        go_changed=true
        log_info "Mudanças em Go detectadas"
    fi
    
    # Detectar mudanças em Node.js/TypeScript
    if git diff --name-only "$base_ref" | grep -E '\.(ts|tsx|js|jsx|json)$' >/dev/null; then
        node_changed=true
        log_info "Mudanças em Node.js detectadas"
    fi
    
    # Detectar mudanças em configurações
    if git diff --name-only "$base_ref" | grep -E '\.(json|yml|yaml|md)$' | grep -E '(nx\.json|tsconfig|package\.json|\.github)' >/dev/null; then
        config_changed=true
        log_info "Mudanças em configurações detectadas"
    fi
    
    # Output para uso em workflows
    echo "go-changed=$go_changed"
    echo "node-changed=$node_changed"
    echo "config-changed=$config_changed"
    
    log_success "Detecção de mudanças concluída"
}

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

# Função para obter paralelização dinâmica
get_dynamic_parallel() {
    local max_parallel="${1:-4}"
    local available_cores=$(nproc 2>/dev/null || echo "2")
    
    # Usar o menor entre max_parallel e cores disponíveis
    local dynamic_parallel=$((available_cores < max_parallel ? available_cores : max_parallel))
    
    # Em ambiente CI, ser mais conservador
    if is_ci_environment; then
        dynamic_parallel=$((dynamic_parallel / 2))
        dynamic_parallel=$((dynamic_parallel < 1 ? 1 : dynamic_parallel))
    fi
    
    echo "$dynamic_parallel"
}

# Função para executar health check
run_health_check() {
    log_step "Executando health check de serviços externos..."
    
    # Health check do npm registry
    if curl -s --connect-timeout 10 "https://registry.npmjs.org/" >/dev/null 2>&1; then
        log_success "npm registry acessível"
    else
        log_warning "npm registry não acessível"
    fi
    
    # Health check do GitHub API
    if curl -s --connect-timeout 10 "https://api.github.com" >/dev/null 2>&1; then
        log_success "GitHub API acessível"
    else
        log_warning "GitHub API não acessível"
    fi
    
    log_success "Health check concluído"
}

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
export -f validate_prerequisites execute_with_retry execute_task_with_retry execute_with_circuit_breaker is_ci_environment
export -f get_workspace_info validate_cache_integrity cleanup_corrupted_cache
export -f calculate_files_hash detect_language_changes check_pr_labels
export -f check_commit_messages get_dynamic_parallel run_health_check
export -f show_performance_stats
