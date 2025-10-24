#!/bin/bash

# Script de Análise de Performance - Workflows GitHub Actions
# Consulta GitHub API para extrair métricas de performance dos workflows

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
GITHUB_REPO="${GITHUB_REPOSITORY:-mateusmacedo/scouts}"
WORKFLOW_NAME="${WORKFLOW_NAME:-CI}"
RUNS_LIMIT="${RUNS_LIMIT:-10}"

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"
}

# Função para verificar pré-requisitos
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Verifica se gh CLI está instalado
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) not found. Please install it first."
        log "Install: https://cli.github.com/"
        return 1
    fi
    
    # Verifica se jq está instalado
    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install it first."
        log "Install: https://stedolan.github.io/jq/"
        return 1
    fi
    
    # Verifica autenticação do GitHub
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI not authenticated. Please run 'gh auth login'"
        return 1
    fi
    
    log_success "All prerequisites met"
}

# Função para obter workflow runs
get_workflow_runs() {
    local workflow_name="$1"
    local limit="$2"
    
    log "Fetching workflow runs for: $workflow_name (limit: $limit)"
    
    # Obtém workflow ID
    local workflow_id=$(gh api repos/$GITHUB_REPO/actions/workflows --jq ".workflows[] | select(.name == \"$workflow_name\") | .id")
    
    if [ -z "$workflow_id" ]; then
        log_error "Workflow '$workflow_name' not found"
        return 1
    fi
    
    log "Workflow ID: $workflow_id"
    
    # Obtém runs do workflow
    gh api repos/$GITHUB_REPO/actions/workflows/$workflow_id/runs \
        --jq ".workflows[0].runs[0:$limit] | .[] | {
            id: .id,
            status: .status,
            conclusion: .conclusion,
            created_at: .created_at,
            updated_at: .updated_at,
            run_started_at: .run_started_at,
            head_branch: .head_branch,
            head_sha: .head_sha,
            display_title: .display_title,
            jobs_url: .jobs_url
        }"
}

# Função para obter detalhes de um job
get_job_details() {
    local run_id="$1"
    
    log "Fetching job details for run: $run_id"
    
    gh api repos/$GITHUB_REPO/actions/runs/$run_id/jobs \
        --jq ".jobs[] | {
            id: .id,
            name: .name,
            status: .status,
            conclusion: .conclusion,
            started_at: .started_at,
            completed_at: .completed_at,
            steps: [.steps[] | {
                name: .name,
                status: .status,
                conclusion: .conclusion,
                started_at: .started_at,
                completed_at: .completed_at,
                number: .number
            }]
        }"
}

# Função para calcular duração
calculate_duration() {
    local start_time="$1"
    local end_time="$2"
    
    if [ -z "$start_time" ] || [ -z "$end_time" ]; then
        echo "N/A"
        return
    fi
    
    # Converte timestamps para segundos
    local start_epoch=$(date -d "$start_time" +%s 2>/dev/null || echo "0")
    local end_epoch=$(date -d "$end_time" +%s 2>/dev/null || echo "0")
    
    if [ "$start_epoch" -eq 0 ] || [ "$end_epoch" -eq 0 ]; then
        echo "N/A"
        return
    fi
    
    local duration=$((end_epoch - start_epoch))
    echo "${duration}s"
}

# Função para analisar performance
analyze_performance() {
    local workflow_name="$1"
    local limit="$2"
    
    log "Analyzing performance for workflow: $workflow_name"
    
    # Obtém runs do workflow
    local runs=$(get_workflow_runs "$workflow_name" "$limit")
    
    if [ -z "$runs" ]; then
        log_error "No workflow runs found"
        return 1
    fi
    
    # Processa cada run
    echo "$runs" | jq -r '.id' | while read -r run_id; do
        log "Processing run: $run_id"
        
        # Obtém detalhes do job
        local job_details=$(get_job_details "$run_id")
        
        # Analisa cada job
        echo "$job_details" | jq -r '.name' | while read -r job_name; do
            log "Analyzing job: $job_name"
            
            # Extrai métricas do job
            local job_data=$(echo "$job_details" | jq -r "select(.name == \"$job_name\")")
            
            local job_status=$(echo "$job_data" | jq -r '.status')
            local job_conclusion=$(echo "$job_data" | jq -r '.conclusion')
            local job_started=$(echo "$job_data" | jq -r '.started_at')
            local job_completed=$(echo "$job_data" | jq -r '.completed_at')
            
            local job_duration=$(calculate_duration "$job_started" "$job_completed")
            
            log "Job: $job_name | Status: $job_status | Conclusion: $job_conclusion | Duration: $job_duration"
            
            # Analisa steps do job
            echo "$job_data" | jq -r '.steps[] | "\(.name)|\(.status)|\(.conclusion)|\(.started_at)|\(.completed_at)"' | while IFS='|' read -r step_name step_status step_conclusion step_started step_completed; do
                local step_duration=$(calculate_duration "$step_started" "$step_completed")
                log "  Step: $step_name | Status: $step_status | Duration: $step_duration"
            done
        done
    done
}

# Função para gerar relatório de performance
generate_performance_report() {
    local workflow_name="$1"
    local limit="$2"
    local output_file=".github/workflows/PERFORMANCE_ANALYSIS.md"
    
    log "Generating performance analysis report..."
    
    cat > "$output_file" << EOF
# Análise de Performance - Workflows GitHub Actions

## Configuração
- **Repositório:** $GITHUB_REPO
- **Workflow:** $workflow_name
- **Runs analisados:** $limit
- **Data da análise:** $(date)

## Métricas Coletadas

### Resumo Executivo
EOF

    # Obtém runs do workflow
    local runs=$(get_workflow_runs "$workflow_name" "$limit")
    
    if [ -n "$runs" ]; then
        # Calcula estatísticas básicas
        local total_runs=$(echo "$runs" | jq -s 'length')
        local successful_runs=$(echo "$runs" | jq -s '[.[] | select(.conclusion == "success")] | length')
        local failed_runs=$(echo "$runs" | jq -s '[.[] | select(.conclusion == "failure")] | length')
        
        cat >> "$output_file" << EOF

- **Total de runs:** $total_runs
- **Runs bem-sucedidos:** $successful_runs
- **Runs com falha:** $failed_runs
- **Taxa de sucesso:** $(( successful_runs * 100 / total_runs ))%

### Detalhes dos Runs

EOF

        # Adiciona detalhes de cada run
        echo "$runs" | jq -r '.id' | while read -r run_id; do
            local run_data=$(echo "$runs" | jq -r "select(.id == $run_id)")
            local run_status=$(echo "$run_data" | jq -r '.status')
            local run_conclusion=$(echo "$run_data" | jq -r '.conclusion')
            local run_branch=$(echo "$run_data" | jq -r '.head_branch')
            local run_title=$(echo "$run_data" | jq -r '.display_title')
            
            cat >> "$output_file" << EOF

#### Run $run_id
- **Branch:** $run_branch
- **Título:** $run_title
- **Status:** $run_status
- **Conclusão:** $run_conclusion

EOF
        done
    else
        cat >> "$output_file" << EOF

**Nenhum run encontrado para análise.**

EOF
    fi

    cat >> "$output_file" << EOF

## Recomendações

### Otimizações Identificadas
1. **Nx affected refs:** Implementar base/head refs corretos
2. **Nx cache:** Adicionar persistência do cache local
3. **Paralelização:** Implementar --parallel flag
4. **Actions:** Atualizar para versões mais recentes

### Próximos Passos
1. Implementar otimizações identificadas
2. Re-executar workflows
3. Comparar métricas antes/depois
4. Documentar melhorias alcançadas

EOF

    log_success "Performance analysis report generated: $output_file"
}

# Função para monitorar workflow em tempo real
monitor_workflow() {
    local workflow_name="$1"
    local branch="${2:-test/workflow-validation}"
    
    log "Monitoring workflow: $workflow_name for branch: $branch"
    
    # Obtém workflow ID
    local workflow_id=$(gh api repos/$GITHUB_REPO/actions/workflows --jq ".workflows[] | select(.name == \"$workflow_name\") | .id")
    
    if [ -z "$workflow_id" ]; then
        log_error "Workflow '$workflow_name' not found"
        return 1
    fi
    
    # Monitora runs em tempo real
    while true; do
        local latest_run=$(gh api repos/$GITHUB_REPO/actions/workflows/$workflow_id/runs \
            --jq ".workflows[0].runs[0] | select(.head_branch == \"$branch\")")
        
        if [ -n "$latest_run" ]; then
            local run_id=$(echo "$latest_run" | jq -r '.id')
            local status=$(echo "$latest_run" | jq -r '.status')
            local conclusion=$(echo "$latest_run" | jq -r '.conclusion')
            
            log "Latest run: $run_id | Status: $status | Conclusion: $conclusion"
            
            if [ "$status" = "completed" ]; then
                log_success "Workflow completed with conclusion: $conclusion"
                break
            fi
        fi
        
        sleep 30
    done
}

# Menu principal
main() {
    log "GitHub Actions Performance Analysis Tool"
    log "======================================="
    
    # Verifica pré-requisitos
    check_prerequisites
    
    # Analisa performance
    analyze_performance "$WORKFLOW_NAME" "$RUNS_LIMIT"
    
    # Gera relatório
    generate_performance_report "$WORKFLOW_NAME" "$RUNS_LIMIT"
    
    log_success "Performance analysis completed!"
}

# Executa o script
main "$@"
