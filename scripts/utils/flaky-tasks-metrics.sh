#!/bin/bash

# Script para coletar e analisar métricas de flaky tasks
# Uso: ./scripts/utils/flaky-tasks-metrics.sh [--output=json] [--period=30d]

# Carregar funções comuns
source "$(dirname "$0")/common-functions.sh"

# Configurações padrão
OUTPUT_FORMAT="json"
PERIOD="30d"
VERBOSE=false
METRICS_FILE=".nx/cache/flaky-tasks-metrics.json"

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --output=*)
            OUTPUT_FORMAT="${1#*=}"
            shift
            ;;
        --period=*)
            PERIOD="${1#*=}"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Uso: $0 [opções]"
            echo "Opções:"
            echo "  --output=FORMAT   Formato de saída: json, text, html (padrão: json)"
            echo "  --period=PERIOD   Período de análise: 7d, 30d, 90d (padrão: 30d)"
            echo "  --verbose         Saída verbosa"
            echo "  --help            Mostrar esta ajuda"
            exit 0
            ;;
        *)
            log_error "Opção desconhecida: $1"
            exit 1
            ;;
    esac
done

# Função para coletar métricas do GitHub Actions
collect_github_metrics() {
    local period="$1"
    local since_date
    
    case "$period" in
        "7d")
            since_date=$(date -d "7 days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
            ;;
        "30d")
            since_date=$(date -d "30 days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
            ;;
        "90d")
            since_date=$(date -d "90 days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
            ;;
        *)
            log_error "Período inválido: $period"
            return 1
            ;;
    esac
    
    log_step "Coletando métricas do GitHub Actions desde $since_date"
    
    if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ]; then
        log_warning "GITHUB_TOKEN ou GITHUB_REPOSITORY não definidos"
        log_info "Usando dados simulados para desenvolvimento"
        echo '{"workflow_runs": [], "jobs": []}'
        return 0
    fi
    
    # Coletar execuções de workflow
    local workflow_runs
    workflow_runs=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$GITHUB_REPOSITORY/actions/workflows/ci-optimized.yml/runs?per_page=100&created=>=$since_date&status=completed" | \
        jq '.workflow_runs[] | {
            id: .id,
            status: .conclusion,
            created_at: .created_at,
            updated_at: .updated_at,
            run_number: .run_number,
            head_branch: .head_branch,
            duration: (.updated_at | strptime("%Y-%m-%dT%H:%M:%SZ") | mktime) - (.created_at | strptime("%Y-%m-%dT%H:%M:%SZ") | mktime)
        }')
    
    # Coletar jobs de cada execução
    local all_jobs="[]"
    echo "$workflow_runs" | jq -r '.[] | .id' | while read -r run_id; do
        if [ "$VERBOSE" = "true" ]; then
            log_debug "Coletando jobs para run $run_id"
        fi
        
        local jobs_data
        jobs_data=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$GITHUB_REPOSITORY/actions/runs/$run_id/jobs" | \
            jq '.jobs[] | {
                id: .id,
                name: .name,
                status: .conclusion,
                started_at: .started_at,
                completed_at: .completed_at,
                run_id: "'$run_id'",
                duration: (.completed_at | strptime("%Y-%m-%dT%H:%M:%SZ") | mktime) - (.started_at | strptime("%Y-%m-%dT%H:%M:%SZ") | mktime)
            }')
        
        if [ "$(echo "$jobs_data" | jq length)" -gt 0 ]; then
            all_jobs=$(echo "$all_jobs $jobs_data" | jq -s 'add')
        fi
    done
    
    # Combinar dados
    jq -n --argjson runs "$workflow_runs" --argjson jobs "$all_jobs" '{
        workflow_runs: $runs,
        jobs: $jobs,
        period: "'$period'",
        since_date: "'$since_date'"
    }'
}

# Função para analisar tendências
analyze_trends() {
    local metrics_data="$1"
    
    log_step "Analisando tendências de flaky tasks"
    
    # Calcular métricas por job
    local job_metrics
    job_metrics=$(echo "$metrics_data" | jq -r '.jobs | group_by(.name) | map({
        name: .[0].name,
        total_runs: length,
        failed_runs: map(select(.status == "failure")) | length,
        success_runs: map(select(.status == "success")) | length,
        cancelled_runs: map(select(.status == "cancelled")) | length,
        skipped_runs: map(select(.status == "skipped")) | length,
        failure_rate: (map(select(.status == "failure")) | length) / length * 100,
        success_rate: (map(select(.status == "success")) | length) / length * 100,
        avg_duration: (map(.duration) | add) / length,
        min_duration: (map(.duration) | min),
        max_duration: (map(.duration) | max)
    })')
    
    # Identificar tasks flaky
    local flaky_tasks
    flaky_tasks=$(echo "$job_metrics" | jq 'map(select(.failure_rate >= 5 and .failure_rate < 95))')
    
    # Calcular métricas gerais
    local total_runs=$(echo "$metrics_data" | jq '.workflow_runs | length')
    local total_jobs=$(echo "$metrics_data" | jq '.jobs | length')
    local failed_jobs=$(echo "$metrics_data" | jq '.jobs | map(select(.status == "failure")) | length')
    local success_jobs=$(echo "$metrics_data" | jq '.jobs | map(select(.status == "success")) | length')
    
    # Calcular tendências
    local recent_runs=$(echo "$metrics_data" | jq '.workflow_runs | sort_by(.created_at) | .[-10:]')
    local older_runs=$(echo "$metrics_data" | jq '.workflow_runs | sort_by(.created_at) | .[:-10]')
    
    local recent_failure_rate=0
    local older_failure_rate=0
    
    if [ "$(echo "$recent_runs" | jq length)" -gt 0 ]; then
        recent_failure_rate=$(echo "$recent_runs" | jq 'map(select(.status == "failure")) | length / length * 100')
    fi
    
    if [ "$(echo "$older_runs" | jq length)" -gt 0 ]; then
        older_failure_rate=$(echo "$older_runs" | jq 'map(select(.status == "failure")) | length / length * 100')
    fi
    
    local trend_direction="stable"
    if (( $(echo "$recent_failure_rate > $older_failure_rate" | bc -l) )); then
        trend_direction="worsening"
    elif (( $(echo "$recent_failure_rate < $older_failure_rate" | bc -l) )); then
        trend_direction="improving"
    fi
    
    # Gerar relatório
    jq -n --argjson job_metrics "$job_metrics" --argjson flaky_tasks "$flaky_tasks" --arg total_runs "$total_runs" --arg total_jobs "$total_jobs" --arg failed_jobs "$failed_jobs" --arg success_jobs "$success_jobs" --arg recent_failure_rate "$recent_failure_rate" --arg older_failure_rate "$older_failure_rate" --arg trend_direction "$trend_direction" '{
        summary: {
            total_workflow_runs: ($total_runs | tonumber),
            total_jobs: ($total_jobs | tonumber),
            failed_jobs: ($failed_jobs | tonumber),
            success_jobs: ($success_jobs | tonumber),
            overall_failure_rate: (($failed_jobs | tonumber) / ($total_jobs | tonumber) * 100),
            flaky_tasks_count: ($flaky_tasks | length)
        },
        trends: {
            recent_failure_rate: ($recent_failure_rate | tonumber),
            older_failure_rate: ($older_failure_rate | tonumber),
            direction: $trend_direction,
            improvement: ($trend_direction == "improving"),
            worsening: ($trend_direction == "worsening")
        },
        job_metrics: $job_metrics,
        flaky_tasks: $flaky_tasks,
        recommendations: [
            if ($flaky_tasks | length) > 0 then "Implementar retry automático para tasks flaky" else empty end,
            if ($trend_direction == "worsening") then "Investigar causas do aumento de falhas" else empty end,
            if (($failed_jobs | tonumber) / ($total_jobs | tonumber) * 100) > 10 then "Revisar configurações de timeout e recursos" else empty end,
            "Monitorar métricas continuamente",
            "Implementar alertas para degradação de performance"
        ]
    }'
}

# Função para gerar relatório HTML
generate_html_report() {
    local analysis_data="$1"
    local output_file="flaky-tasks-report.html"
    
    log_step "Gerando relatório HTML: $output_file"
    
    cat > "$output_file" << EOF
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Flaky Tasks</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .flaky-card { background: #fff3cd; border-left-color: #ffc107; }
        .success-card { background: #d4edda; border-left-color: #28a745; }
        .warning-card { background: #f8d7da; border-left-color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .trend-up { color: #dc3545; }
        .trend-down { color: #28a745; }
        .trend-stable { color: #6c757d; }
        .chart-container { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Relatório de Flaky Tasks</h1>
            <p>Análise de estabilidade do pipeline CI/CD</p>
            <p><strong>Gerado em:</strong> $(date -u +"%Y-%m-%d %H:%M:%S UTC")</p>
        </div>
        
        <div class="metric-card success-card">
            <h3>📊 Resumo Executivo</h3>
            <p><strong>Total de Execuções:</strong> $(echo "$analysis_data" | jq -r '.summary.total_workflow_runs')</p>
            <p><strong>Total de Jobs:</strong> $(echo "$analysis_data" | jq -r '.summary.total_jobs')</p>
            <p><strong>Taxa de Falha Geral:</strong> $(echo "$analysis_data" | jq -r '.summary.overall_failure_rate | tonumber | floor')%</p>
            <p><strong>Tasks Flaky:</strong> $(echo "$analysis_data" | jq -r '.summary.flaky_tasks_count')</p>
        </div>
        
        <div class="metric-card">
            <h3>📈 Tendências</h3>
            <p><strong>Taxa de Falha Recente:</strong> $(echo "$analysis_data" | jq -r '.trends.recent_failure_rate | tonumber | floor')%</p>
            <p><strong>Taxa de Falha Anterior:</strong> $(echo "$analysis_data" | jq -r '.trends.older_failure_rate | tonumber | floor')%</p>
            <p><strong>Direção:</strong> 
                $(if [ "$(echo "$analysis_data" | jq -r '.trends.direction')" = "improving" ]; then echo "📈 Melhorando"; elif [ "$(echo "$analysis_data" | jq -r '.trends.direction')" = "worsening" ]; then echo "📉 Piorando"; else echo "➡️ Estável"; fi)
            </p>
        </div>
EOF

    # Adicionar tabela de tasks flaky se existirem
    local flaky_count=$(echo "$analysis_data" | jq -r '.flaky_tasks | length')
    if [ "$flaky_count" -gt 0 ]; then
        cat >> "$output_file" << EOF
        
        <div class="metric-card flaky-card">
            <h3>🚨 Tasks Flaky Detectadas</h3>
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Taxa de Falha</th>
                        <th>Execuções</th>
                        <th>Duração Média</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
EOF
        
        echo "$analysis_data" | jq -r '.flaky_tasks[] | "<tr><td>\(.name)</td><td>\(.failure_rate | tonumber | floor)%</td><td>\(.failed_runs)/\(.total_runs)</td><td>\(.avg_duration | tonumber | floor)s</td><td>🚨 Flaky</td></tr>"' >> "$output_file"
        
        cat >> "$output_file" << EOF
                </tbody>
            </table>
        </div>
EOF
    fi
    
    # Adicionar recomendações
    cat >> "$output_file" << EOF
        
        <div class="metric-card">
            <h3>💡 Recomendações</h3>
            <ul>
EOF
    
    echo "$analysis_data" | jq -r '.recommendations[] | "<li>\(.)</li>"' >> "$output_file"
    
    cat >> "$output_file" << EOF
            </ul>
        </div>
        
        <div class="metric-card">
            <h3>📋 Próximos Passos</h3>
            <ul>
                <li>Revisar tasks flaky identificadas</li>
                <li>Implementar correções sugeridas</li>
                <li>Monitorar melhoria na taxa de sucesso</li>
                <li>Atualizar configurações de retry se necessário</li>
                <li>Documentar lições aprendidas</li>
            </ul>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "Relatório HTML gerado: $output_file"
}

# Função principal
main() {
    log_step "Iniciando coleta de métricas de flaky tasks"
    log_info "Configurações: period=${PERIOD}, output=${OUTPUT_FORMAT}"
    
    # Coletar métricas
    local metrics_data
    metrics_data=$(collect_github_metrics "$PERIOD")
    
    if [ "$(echo "$metrics_data" | jq '.workflow_runs | length')" -eq 0 ]; then
        log_warning "Nenhuma execução de workflow encontrada no período $PERIOD"
        return 0
    fi
    
    log_info "Encontradas $(echo "$metrics_data" | jq '.workflow_runs | length') execuções de workflow"
    
    # Analisar tendências
    local analysis_data
    analysis_data=$(analyze_trends "$metrics_data")
    
    # Gerar saída no formato solicitado
    case "$OUTPUT_FORMAT" in
        "json")
            echo "$analysis_data" | jq .
            ;;
        "text")
            echo "=== RELATÓRIO DE MÉTRICAS DE FLAKY TASKS ==="
            echo "Período: $PERIOD"
            echo "Total de execuções: $(echo "$analysis_data" | jq -r '.summary.total_workflow_runs')"
            echo "Total de jobs: $(echo "$analysis_data" | jq -r '.summary.total_jobs')"
            echo "Taxa de falha geral: $(echo "$analysis_data" | jq -r '.summary.overall_failure_rate | tonumber | floor')%"
            echo "Tasks flaky: $(echo "$analysis_data" | jq -r '.summary.flaky_tasks_count')"
            echo ""
            echo "Tendência: $(echo "$analysis_data" | jq -r '.trends.direction')"
            echo ""
            if [ "$(echo "$analysis_data" | jq -r '.flaky_tasks | length')" -gt 0 ]; then
                echo "Tasks flaky detectadas:"
                echo "$analysis_data" | jq -r '.flaky_tasks[] | "• \(.name): \(.failure_rate | tonumber | floor)% falha (\(.failed_runs)/\(.total_runs) execuções)"'
            fi
            ;;
        "html")
            generate_html_report "$analysis_data"
            ;;
    esac
    
    # Salvar métricas históricas
    if [ -f "$METRICS_FILE" ]; then
        local current_metrics=$(cat "$METRICS_FILE")
    else
        local current_metrics='{"history": []}'
    fi
    
    local new_entry
    new_entry=$(jq -n --argjson analysis "$analysis_data" --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" '{
        timestamp: $timestamp,
        period: "'$PERIOD'",
        analysis: $analysis
    }')
    
    echo "$current_metrics" | jq --argjson entry "$new_entry" '.history += [$entry] | .last_updated = now | strftime("%Y-%m-%dT%H:%M:%SZ")' > "$METRICS_FILE"
    
    log_success "Métricas salvas em $METRICS_FILE"
    log_success "Coleta de métricas concluída"
}

# Executar função principal
main "$@"
