#!/bin/bash

# Script para detectar tasks flaky (intermitentes) no pipeline CI/CD
# Uso: ./scripts/utils/detect-flaky-tasks.sh [--threshold=5] [--days=30] [--output=json]

# Carregar funções comuns
source "$(dirname "$0")/common-functions.sh"

# Configurações padrão
THRESHOLD=5  # Taxa de falha mínima para considerar flaky (5%)
DAYS=30      # Período de análise em dias
OUTPUT_FORMAT="json"  # json, text, github
VERBOSE=false
DRY_RUN=false

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --threshold=*)
            THRESHOLD="${1#*=}"
            shift
            ;;
        --days=*)
            DAYS="${1#*=}"
            shift
            ;;
        --output=*)
            OUTPUT_FORMAT="${1#*=}"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Uso: $0 [opções]"
            echo "Opções:"
            echo "  --threshold=N    Taxa de falha mínima para considerar flaky (padrão: 5)"
            echo "  --days=N         Período de análise em dias (padrão: 30)"
            echo "  --output=FORMAT   Formato de saída: json, text, github (padrão: json)"
            echo "  --verbose         Saída verbosa"
            echo "  --dry-run         Apenas simular, não executar"
            echo "  --help            Mostrar esta ajuda"
            exit 0
            ;;
        *)
            log_error "Opção desconhecida: $1"
            exit 1
            ;;
    esac
done

# Validar pré-requisitos
validate_prerequisites

# Função para obter histórico de execuções do GitHub Actions
get_github_workflow_runs() {
    local workflow_id="$1"
    local days="$2"
    local since_date=$(date -d "$days days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Simulando obtenção de workflow runs"
        echo '[]'
        return 0
    fi
    
    # Verificar se estamos em ambiente GitHub Actions
    if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ]; then
        log_warning "GITHUB_TOKEN ou GITHUB_REPOSITORY não definidos"
        log_info "Usando dados simulados para desenvolvimento"
        echo '[]'
        return 0
    fi
    
    local url="https://api.github.com/repos/$GITHUB_REPOSITORY/actions/workflows/$workflow_id/runs"
    local params="?per_page=100&created=>=$since_date&status=completed"
    
    log_debug "Obtendo execuções do workflow: $url$params"
    
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         "$url$params" | jq '.workflow_runs[] | {
            id: .id,
            status: .conclusion,
            created_at: .created_at,
            updated_at: .updated_at,
            run_number: .run_number,
            head_branch: .head_branch,
            jobs_url: .jobs_url
        }'
}

# Função para obter detalhes dos jobs de uma execução
get_workflow_jobs() {
    local run_id="$1"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Simulando obtenção de jobs para run $run_id"
        echo '[]'
        return 0
    fi
    
    if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ]; then
        echo '[]'
        return 0
    fi
    
    local url="https://api.github.com/repos/$GITHUB_REPOSITORY/actions/runs/$run_id/jobs"
    
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         "$url" | jq '.jobs[] | {
            id: .id,
            name: .name,
            status: .conclusion,
            started_at: .started_at,
            completed_at: .completed_at,
            steps: [.steps[] | {
                name: .name,
                status: .conclusion,
                number: .number,
                started_at: .started_at,
                completed_at: .completed_at
            }]
        }'
}

# Função para analisar padrões de falha
analyze_failure_patterns() {
    local jobs_data="$1"
    local threshold="$2"
    
    log_step "Analisando padrões de falha com threshold de ${threshold}%"
    
    # Agrupar jobs por nome e calcular taxa de falha
    echo "$jobs_data" | jq -r --arg threshold "$threshold" '
    group_by(.name) | 
    map({
        name: .[0].name,
        total_runs: length,
        failed_runs: map(select(.status == "failure")) | length,
        success_runs: map(select(.status == "success")) | length,
        cancelled_runs: map(select(.status == "cancelled")) | length,
        skipped_runs: map(select(.status == "skipped")) | length,
        failure_rate: (map(select(.status == "failure")) | length) / length * 100,
        success_rate: (map(select(.status == "success")) | length) / length * 100
    }) |
    map(select(.failure_rate >= ($threshold | tonumber) and .failure_rate < 95)) |
    sort_by(.failure_rate) | reverse
    '
}

# Função para detectar tasks flaky
detect_flaky_tasks() {
    local threshold="$1"
    local days="$2"
    
    log_step "Detectando tasks flaky nos últimos $days dias com threshold de ${threshold}%"
    
    # Obter execuções do workflow CI
    local workflow_runs
    workflow_runs=$(get_github_workflow_runs "ci-optimized.yml" "$days")
    
    if [ "$(echo "$workflow_runs" | jq length)" -eq 0 ]; then
        log_warning "Nenhuma execução de workflow encontrada"
        return 0
    fi
    
    log_info "Encontradas $(echo "$workflow_runs" | jq length) execuções"
    
    # Coletar dados de todos os jobs
    local all_jobs="[]"
    local run_count=0
    
    echo "$workflow_runs" | jq -r '.[] | .id' | while read -r run_id; do
        if [ "$VERBOSE" = "true" ]; then
            log_debug "Processando run $run_id"
        fi
        
        local jobs_data
        jobs_data=$(get_workflow_jobs "$run_id")
        
        if [ "$(echo "$jobs_data" | jq length)" -gt 0 ]; then
            all_jobs=$(echo "$all_jobs $jobs_data" | jq -s 'add')
            run_count=$((run_count + 1))
        fi
    done
    
    if [ "$run_count" -eq 0 ]; then
        log_warning "Nenhum job encontrado para análise"
        return 0
    fi
    
    log_info "Analisando $run_count execuções com jobs"
    
    # Analisar padrões de falha
    local flaky_tasks
    flaky_tasks=$(analyze_failure_patterns "$all_jobs" "$threshold")
    
    if [ "$(echo "$flaky_tasks" | jq length)" -eq 0 ]; then
        log_success "Nenhuma task flaky detectada"
        return 0
    fi
    
    log_warning "Detectadas $(echo "$flaky_tasks" | jq length) tasks flaky"
    
    # Gerar relatório
    generate_flaky_report "$flaky_tasks" "$threshold" "$days"
}

# Função para gerar relatório de tasks flaky
generate_flaky_report() {
    local flaky_tasks="$1"
    local threshold="$2"
    local days="$3"
    
    local report
    report=$(jq -n --arg threshold "$threshold" --arg days "$days" --argjson tasks "$flaky_tasks" '{
        metadata: {
            generated_at: now | strftime("%Y-%m-%dT%H:%M:%SZ"),
            threshold: ($threshold | tonumber),
            analysis_period_days: ($days | tonumber),
            total_flaky_tasks: ($tasks | length)
        },
        flaky_tasks: $tasks,
        recommendations: [
            "Implementar retry automático para tasks com alta taxa de falha",
            "Investigar causas raiz das falhas intermitentes",
            "Adicionar timeouts apropriados para tasks longas",
            "Melhorar isolamento de testes para evitar dependências externas",
            "Implementar circuit breaker para evitar cascata de falhas"
        ]
    }')
    
    case "$OUTPUT_FORMAT" in
        "json")
            echo "$report" | jq .
            ;;
        "text")
            echo "=== RELATÓRIO DE TASKS FLAKY ==="
            echo "Período de análise: $days dias"
            echo "Threshold: ${threshold}%"
            echo "Tasks flaky detectadas: $(echo "$flaky_tasks" | jq length)"
            echo ""
            echo "$flaky_tasks" | jq -r '.[] | "• \(.name): \(.failure_rate | tonumber | floor)% falha (\(.failed_runs)/\(.total_runs) execuções)"'
            ;;
        "github")
            echo "## 🚨 Tasks Flaky Detectadas" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo "**Período de análise:** $days dias" >> "$GITHUB_STEP_SUMMARY"
            echo "**Threshold:** ${threshold}%" >> "$GITHUB_STEP_SUMMARY"
            echo "**Total de tasks flaky:** $(echo "$flaky_tasks" | jq length)" >> "$GITHUB_STEP_SUMMARY"
            echo "" >> "$GITHUB_STEP_SUMMARY"
            echo "| Task | Taxa de Falha | Execuções | Status |" >> "$GITHUB_STEP_SUMMARY"
            echo "|------|---------------|-----------|--------|" >> "$GITHUB_STEP_SUMMARY"
            echo "$flaky_tasks" | jq -r '.[] | "| \(.name) | \(.failure_rate | tonumber | floor)% | \(.failed_runs)/\(.total_runs) | 🚨 Flaky |"'
            ;;
    esac
}

# Função para salvar métricas históricas
save_metrics() {
    local flaky_tasks="$1"
    local metrics_file=".nx/cache/flaky-tasks-metrics.json"
    
    mkdir -p "$(dirname "$metrics_file")"
    
    local current_metrics
    if [ -f "$metrics_file" ]; then
        current_metrics=$(cat "$metrics_file")
    else
        current_metrics='{"history": []}'
    fi
    
    local new_entry
    new_entry=$(jq -n --argjson tasks "$flaky_tasks" --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" '{
        timestamp: $timestamp,
        flaky_tasks: $tasks,
        total_count: ($tasks | length)
    }')
    
    echo "$current_metrics" | jq --argjson entry "$new_entry" '.history += [$entry] | .last_updated = now | strftime("%Y-%m-%dT%H:%M:%SZ")' > "$metrics_file"
    
    log_success "Métricas salvas em $metrics_file"
}

# Função principal
main() {
    log_step "Iniciando detecção de tasks flaky"
    log_info "Configurações: threshold=${THRESHOLD}%, days=${DAYS}, output=${OUTPUT_FORMAT}"
    
    # Detectar tasks flaky
    detect_flaky_tasks "$THRESHOLD" "$DAYS"
    
    # Salvar métricas se não for dry-run
    if [ "$DRY_RUN" = "false" ]; then
        local flaky_tasks
        flaky_tasks=$(detect_flaky_tasks "$THRESHOLD" "$DAYS" | jq '.flaky_tasks')
        save_metrics "$flaky_tasks"
    fi
    
    log_success "Detecção de tasks flaky concluída"
}

# Executar função principal
main "$@"
