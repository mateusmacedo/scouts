#!/bin/bash

# Script de Simulação Local - Workflows GitHub Actions
# Simula execução dos workflows localmente para validação e coleta de métricas

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

# Função para medir tempo de execução
measure_time() {
    local start_time
    local end_time
    local duration
    start_time=$(date +%s)
    
    # Executa o comando passado como parâmetro
    "$@"
    local exit_code=$?
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    echo "Duration: ${duration}s"
    return $exit_code
}

# Função para simular nx affected com diferentes bases
simulate_nx_affected() {
    local base=$1
    local head=$2
    local description=$3
    
    log "Simulating nx affected: $description"
    log "Base: $base, Head: $head"
    
    # Simula o comando nx affected
    local start_time
    start_time=$(date +%s)
    
    if [ "$base" = "origin/main" ] && [ "$head" = "HEAD" ]; then
        # Para pushes em main
        nx affected -t lint test build --base=origin/main~1 --head=origin/main
    elif [ "$base" = "origin/main" ] && [ -n "$head" ]; then
        # Para PRs
        nx affected -t lint test build --base=origin/main --head=$head
    else
        # Para desenvolvimento local
        nx affected -t lint test build
    fi
    
    local end_time
    local duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    log_success "nx affected completed in ${duration}s"
    return 0
}

# Função para verificar cache do Nx
check_nx_cache() {
    log "Checking Nx cache status..."
    
    if [ -d ".nx/cache" ]; then
        local cache_size
        cache_size=$(du -sh .nx/cache | cut -f1)
        log_success "Nx cache exists: $cache_size"
        
        # Lista arquivos de cache
        local cache_files
        cache_files=$(find .nx/cache -name "*.json" | wc -l)
        log "Cache files: $cache_files"
    else
        log_warning "Nx cache directory not found"
    fi
}

# Função para simular setup de dependências
simulate_setup() {
    log "Simulating dependency setup..."
    
    # Verifica se pnpm está instalado
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm not found. Please install pnpm first."
        return 1
    fi
    
    # Verifica se Go está instalado
    if ! command -v go &> /dev/null; then
        log_error "Go not found. Please install Go first."
        return 1
    fi
    
    # Verifica se nx está instalado
    if ! command -v nx &> /dev/null; then
        log_error "nx not found. Please install nx first."
        return 1
    fi
    
    log_success "All dependencies found"
}

# Função para simular cache restore
simulate_cache_restore() {
    log "Simulating cache restore..."
    
    # Simula cache do pnpm
    if [ -d "$HOME/.pnpm-store" ]; then
        log_success "pnpm cache found"
    else
        log_warning "pnpm cache not found (first run)"
    fi
    
    # Simula cache do Go
    if [ -d "$HOME/.cache/go-build" ] || [ -d "$HOME/go/pkg/mod" ]; then
        log_success "Go cache found"
    else
        log_warning "Go cache not found (first run)"
    fi
    
    # Verifica cache do Nx
    check_nx_cache
}

# Função para simular instalação de dependências
simulate_install() {
    log "Simulating dependency installation..."
    
    local start_time
    start_time=$(date +%s)
    
    # Instala dependências
    pnpm install --frozen-lockfile
    
    local end_time
    local duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    log_success "Dependencies installed in ${duration}s"
}

# Função principal para simular CI workflow
simulate_ci_workflow() {
    local scenario=$1
    local base=${2:-"origin/main"}
    local head=${3:-"HEAD"}
    
    log "Starting CI workflow simulation: $scenario"
    log "Base: $base, Head: $head"
    
    # Step 1: Checkout (simulado)
    log "Step 1: Checkout (simulated)"
    
    # Step 2: Setup Node.js (simulado)
    log "Step 2: Setup Node.js (simulated)"
    
    # Step 3: Setup pnpm (simulado)
    log "Step 3: Setup pnpm (simulated)"
    
    # Step 4: Setup Go (simulado)
    log "Step 4: Setup Go (simulated)"
    
    # Step 5: Cache restore
    simulate_cache_restore
    
    # Step 6: Install dependencies
    simulate_install
    
    # Step 7: Run nx affected
    simulate_nx_affected "$base" "$head" "$scenario"
    
    log_success "CI workflow simulation completed: $scenario"
}

# Função para simular release workflow
simulate_release_workflow() {
    log "Starting Release workflow simulation..."
    
    # Verifica se estamos na branch main
    local current_branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        log_warning "Not on main branch (current: $current_branch)"
    fi
    
    # Simula dry-run do release
    log "Simulating release dry-run..."
    nx release version --dry-run
    
    log_success "Release workflow simulation completed"
}

# Função para gerar relatório de performance
generate_performance_report() {
    local output_file=".github/workflows/PERFORMANCE_REPORT.md"
    
    log "Generating performance report..."
    
    cat > "$output_file" << EOF
# Relatório de Performance - Simulação Local

## Data da Simulação
$(date)

## Cenários Testados

### C1.1 - Lib Compartilhada (logger-node)
- **Arquivo modificado:** libs/logger-node/src/index.ts
- **Projetos afetados esperados:** bff-nest, express-notifier, user-go-service
- **Status:** Simulado

### C1.2 - App Isolado (user-go-service)
- **Arquivo modificado:** apps/user-go-service/main.go
- **Projetos afetados esperados:** user-go-service
- **Status:** Simulado

### C1.3 - Config Global (nx.json)
- **Arquivo modificado:** nx.json
- **Projetos afetados esperados:** Todos
- **Status:** Simulado

### C1.4 - Lib Específica (utils-nest)
- **Arquivo modificado:** libs/utils-nest/src/index.ts
- **Projetos afetados esperados:** bff-nest
- **Status:** Simulado

## Métricas Coletadas

### Cache Status
- **Nx cache:** $(if [ -d ".nx/cache" ]; then echo "Presente"; else echo "Ausente"; fi)
- **pnpm cache:** $(if [ -d "$HOME/.pnpm-store" ]; then echo "Presente"; else echo "Ausente"; fi)
- **Go cache:** $(if [ -d "$HOME/.cache/go-build" ]; then echo "Presente"; else echo "Ausente"; fi)

### Dependências
- **pnpm:** $(pnpm --version 2>/dev/null || echo "Não instalado")
- **Go:** $(go version 2>/dev/null || echo "Não instalado")
- **nx:** $(nx --version 2>/dev/null || echo "Não instalado")

## Próximos Passos
1. Executar workflows reais no GitHub Actions
2. Coletar métricas de tempo reais
3. Comparar com simulação local
4. Identificar gaps de performance

EOF

    log_success "Performance report generated: $output_file"
}

# Menu principal
main() {
    log "GitHub Actions Workflow Simulation Tool"
    log "========================================"
    
    # Verifica pré-requisitos
    simulate_setup
    
    # Simula diferentes cenários
    log "Simulating test scenarios..."
    
    # C1.1 - Lib compartilhada
    simulate_ci_workflow "C1.1 - Lib Compartilhada" "origin/main" "HEAD"
    
    # C1.2 - App isolado
    simulate_ci_workflow "C1.2 - App Isolado" "origin/main" "HEAD"
    
    # C1.3 - Config global
    simulate_ci_workflow "C1.3 - Config Global" "origin/main" "HEAD"
    
    # C1.4 - Lib específica
    simulate_ci_workflow "C1.4 - Lib Específica" "origin/main" "HEAD"
    
    # Simula release workflow
    simulate_release_workflow
    
    # Gera relatório
    generate_performance_report
    
    log_success "All simulations completed!"
}

# Executa o script
main "$@"
