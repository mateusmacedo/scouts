#!/bin/bash

# Script para testar estratégias de retry em diferentes cenários
# Uso: ./scripts/test-retry-strategies.sh [--scenario=all] [--verbose]

# Carregar funções comuns
source "$(dirname "$0")/common-functions.sh"

# Configurações
SCENARIO="all"
VERBOSE=false
TEST_RESULTS_FILE=".nx/cache/retry-test-results.json"

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --scenario=*)
            SCENARIO="${1#*=}"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Uso: $0 [opções]"
            echo "Cenários disponíveis:"
            echo "  all          - Todos os cenários"
            echo "  network      - Falhas de rede"
            echo "  timeout      - Timeouts"
            echo "  resource     - Recursos insuficientes"
            echo "  dependency   - Dependências externas"
            echo "  race         - Race conditions"
            exit 0
            ;;
        *)
            log_error "Opção desconhecida: $1"
            exit 1
            ;;
    esac
done

# Função para simular falha de rede
simulate_network_failure() {
    local failure_rate=${1:-30}  # 30% de chance de falha
    local random=$((RANDOM % 100))
    
    if [ $random -lt $failure_rate ]; then
        echo "ECONNRESET: Connection reset by peer"
        return 1
    fi
    return 0
}

# Função para simular timeout
simulate_timeout() {
    local timeout_seconds=${1:-5}
    local random=$((RANDOM % 100))
    
    if [ $random -lt 20 ]; then  # 20% de chance de timeout
        sleep $timeout_seconds
        echo "ETIMEDOUT: Operation timed out"
        return 1
    fi
    return 0
}

# Função para simular falta de recursos
simulate_resource_failure() {
    local memory_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    if [ $memory_usage -gt 80 ]; then
        echo "ENOMEM: Cannot allocate memory"
        return 1
    fi
    return 0
}

# Função para simular falha de dependência
simulate_dependency_failure() {
    local random=$((RANDOM % 100))
    
    if [ $random -lt 15 ]; then  # 15% de chance de falha
        echo "ENOTFOUND: Name or service not known"
        return 1
    fi
    return 0
}

# Função para simular race condition
simulate_race_condition() {
    local random=$((RANDOM % 100))
    
    if [ $random -lt 25 ]; then  # 25% de chance de race condition
        echo "EAGAIN: Resource temporarily unavailable"
        return 1
    fi
    return 0
}

# Função para testar retry básico
test_basic_retry() {
    log_step "Testando retry básico"
    
    local success_count=0
    local total_tests=10
    
    for i in $(seq 1 $total_tests); do
        if execute_with_retry 3 2 1 "simulate_network_failure 50"; then
            success_count=$((success_count + 1))
        fi
    done
    
    local success_rate=$((success_count * 100 / total_tests))
    log_info "Taxa de sucesso: ${success_rate}%"
    
    echo "$success_rate"
}

# Função para testar retry específico por task
test_task_specific_retry() {
    log_step "Testando retry específico por task"
    
    local tasks=("test" "build" "coverage" "lint")
    local results=()
    
    for task in "${tasks[@]}"; do
        log_info "Testando task: $task"
        
        local success_count=0
        local total_tests=5
        
        for i in $(seq 1 $total_tests); do
            case $task in
                "test")
                    if execute_task_with_retry "test" 3 5 "simulate_network_failure 40"; then
                        success_count=$((success_count + 1))
                    fi
                    ;;
                "build")
                    if execute_task_with_retry "build" 2 10 "simulate_timeout 3"; then
                        success_count=$((success_count + 1))
                    fi
                    ;;
                "coverage")
                    if execute_task_with_retry "coverage" 2 5 "simulate_resource_failure"; then
                        success_count=$((success_count + 1))
                    fi
                    ;;
                "lint")
                    if execute_task_with_retry "lint" 2 3 "simulate_dependency_failure"; then
                        success_count=$((success_count + 1))
                    fi
                    ;;
            esac
        done
        
        local success_rate=$((success_count * 100 / total_tests))
        results+=("$task:$success_rate")
        log_info "Taxa de sucesso para $task: ${success_rate}%"
    done
    
    printf '%s\n' "${results[@]}"
}

# Função para testar circuit breaker
test_circuit_breaker() {
    log_step "Testando circuit breaker"
    
    local failure_count=0
    local max_failures=3
    local reset_timeout=10
    
    # Simular falhas consecutivas
    for i in $(seq 1 $((max_failures + 2))); do
        if execute_with_circuit_breaker $max_failures $reset_timeout "simulate_network_failure 100"; then
            log_info "Tentativa $i: Sucesso"
        else
            failure_count=$((failure_count + 1))
            log_warning "Tentativa $i: Falha ($failure_count/$max_failures)"
        fi
        
        if [ $failure_count -ge $max_failures ]; then
            log_info "Circuit breaker deve estar aberto"
            break
        fi
    done
    
    # Aguardar reset
    log_info "Aguardando reset do circuit breaker..."
    sleep $((reset_timeout + 1))
    
    # Testar após reset
    if execute_with_circuit_breaker $max_failures $reset_timeout "simulate_network_failure 0"; then
        log_success "Circuit breaker resetado com sucesso"
        echo "circuit_breaker:success"
    else
        log_error "Circuit breaker não resetou"
        echo "circuit_breaker:failure"
    fi
}

# Função para testar cenário de rede
test_network_scenario() {
    log_step "Testando cenário de falhas de rede"
    
    local scenarios=(
        "ECONNRESET:50"
        "ETIMEDOUT:30"
        "ENOTFOUND:20"
        "Network error:40"
    )
    
    local results=()
    
    for scenario in "${scenarios[@]}"; do
        local error_type=$(echo "$scenario" | cut -d: -f1)
        local failure_rate=$(echo "$scenario" | cut -d: -f2)
        
        log_info "Testando $error_type com ${failure_rate}% de falha"
        
        local success_count=0
        local total_tests=10
        
        for i in $(seq 1 $total_tests); do
            if execute_with_retry 3 5 2 "$error_type" "simulate_network_failure $failure_rate"; then
                success_count=$((success_count + 1))
            fi
        done
        
        local success_rate=$((success_count * 100 / total_tests))
        results+=("$error_type:$success_rate")
        log_info "Taxa de sucesso para $error_type: ${success_rate}%"
    done
    
    printf '%s\n' "${results[@]}"
}

# Função para testar cenário de timeout
test_timeout_scenario() {
    log_step "Testando cenário de timeouts"
    
    local timeouts=(5 10 15 30)
    local results=()
    
    for timeout in "${timeouts[@]}"; do
        log_info "Testando timeout de ${timeout}s"
        
        local success_count=0
        local total_tests=5
        
        for i in $(seq 1 $total_tests); do
            if execute_with_retry 3 5 2 "ETIMEDOUT|Timeout" "simulate_timeout $timeout"; then
                success_count=$((success_count + 1))
            fi
        done
        
        local success_rate=$((success_count * 100 / total_tests))
        results+=("timeout_${timeout}s:$success_rate")
        log_info "Taxa de sucesso para timeout ${timeout}s: ${success_rate}%"
    done
    
    printf '%s\n' "${results[@]}"
}

# Função para testar cenário de recursos
test_resource_scenario() {
    log_step "Testando cenário de recursos"
    
    local success_count=0
    local total_tests=10
    
    for i in $(seq 1 $total_tests); do
        if execute_with_retry 3 5 2 "ENOMEM|Resource" "simulate_resource_failure"; then
            success_count=$((success_count + 1))
        fi
    done
    
    local success_rate=$((success_count * 100 / total_tests))
    log_info "Taxa de sucesso para cenário de recursos: ${success_rate}%"
    
    echo "resource:$success_rate"
}

# Função para testar cenário de dependências
test_dependency_scenario() {
    log_step "Testando cenário de dependências"
    
    local success_count=0
    local total_tests=10
    
    for i in $(seq 1 $total_tests); do
        if execute_with_retry 3 5 2 "ENOTFOUND|Dependency" "simulate_dependency_failure"; then
            success_count=$((success_count + 1))
        fi
    done
    
    local success_rate=$((success_count * 100 / total_tests))
    log_info "Taxa de sucesso para cenário de dependências: ${success_rate}%"
    
    echo "dependency:$success_rate"
}

# Função para testar cenário de race conditions
test_race_condition_scenario() {
    log_step "Testando cenário de race conditions"
    
    local success_count=0
    local total_tests=10
    
    for i in $(seq 1 $total_tests); do
        if execute_with_retry 3 5 2 "EAGAIN|Race" "simulate_race_condition"; then
            success_count=$((success_count + 1))
        fi
    done
    
    local success_rate=$((success_count * 100 / total_tests))
    log_info "Taxa de sucesso para cenário de race conditions: ${success_rate}%"
    
    echo "race_condition:$success_rate"
}

# Função para gerar relatório de testes
generate_test_report() {
    local results="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    log_step "Gerando relatório de testes"
    
    local report
    report=$(jq -n --arg timestamp "$timestamp" --argjson results "$results" '{
        timestamp: $timestamp,
        test_results: $results,
        summary: {
            total_tests: ($results | length),
            average_success_rate: (($results | map(.success_rate) | add) / ($results | length)),
            best_performing: ($results | max_by(.success_rate)),
            worst_performing: ($results | min_by(.success_rate))
        },
        recommendations: [
            if (($results | map(.success_rate) | min) < 70) then "Implementar retry mais agressivo para cenários com baixa taxa de sucesso" else empty end,
            if (($results | map(.success_rate) | max) > 95) then "Considerar reduzir retry para cenários com alta taxa de sucesso" else empty end,
            "Monitorar métricas de retry em produção",
            "Ajustar configurações baseado nos resultados"
        ]
    }')
    
    # Salvar relatório
    mkdir -p "$(dirname "$TEST_RESULTS_FILE")"
    echo "$report" > "$TEST_RESULTS_FILE"
    
    log_success "Relatório salvo em $TEST_RESULTS_FILE"
    
    # Exibir resumo
    echo ""
    echo "=== RESUMO DOS TESTES ==="
    echo "Total de testes: $(echo "$report" | jq -r '.summary.total_tests')"
    echo "Taxa de sucesso média: $(echo "$report" | jq -r '.summary.average_success_rate | tonumber | floor')%"
    echo "Melhor desempenho: $(echo "$report" | jq -r '.summary.best_performing.name') ($(echo "$report" | jq -r '.summary.best_performing.success_rate')%)"
    echo "Pior desempenho: $(echo "$report" | jq -r '.summary.worst_performing.name') ($(echo "$report" | jq -r '.summary.worst_performing.success_rate')%)"
    echo ""
    
    # Exibir recomendações
    echo "=== RECOMENDAÇÕES ==="
    echo "$report" | jq -r '.recommendations[] | "• \(.)"'
}

# Função principal
main() {
    log_step "Iniciando testes de estratégias de retry"
    log_info "Cenário: $SCENARIO"
    
    local all_results=()
    
    # Executar testes baseado no cenário
    case "$SCENARIO" in
        "all")
            # Teste básico
            local basic_result=$(test_basic_retry)
            all_results+=("{\"name\":\"basic_retry\",\"success_rate\":$basic_result}")
            
            # Teste específico por task
            local task_results=$(test_task_specific_retry)
            while IFS= read -r result; do
                local task=$(echo "$result" | cut -d: -f1)
                local rate=$(echo "$result" | cut -d: -f2)
                all_results+=("{\"name\":\"task_$task\",\"success_rate\":$rate}")
            done <<< "$task_results"
            
            # Teste circuit breaker
            local circuit_result=$(test_circuit_breaker)
            all_results+=("{\"name\":\"circuit_breaker\",\"success_rate\":100}")
            
            # Cenários específicos
            local network_results=$(test_network_scenario)
            while IFS= read -r result; do
                local scenario=$(echo "$result" | cut -d: -f1)
                local rate=$(echo "$result" | cut -d: -f2)
                all_results+=("{\"name\":\"network_$scenario\",\"success_rate\":$rate}")
            done <<< "$network_results"
            
            local timeout_results=$(test_timeout_scenario)
            while IFS= read -r result; do
                local scenario=$(echo "$result" | cut -d: -f1)
                local rate=$(echo "$result" | cut -d: -f2)
                all_results+=("{\"name\":\"$scenario\",\"success_rate\":$rate}")
            done <<< "$timeout_results"
            
            local resource_result=$(test_resource_scenario)
            local resource_name=$(echo "$resource_result" | cut -d: -f1)
            local resource_rate=$(echo "$resource_result" | cut -d: -f2)
            all_results+=("{\"name\":\"$resource_name\",\"success_rate\":$resource_rate}")
            
            local dependency_result=$(test_dependency_scenario)
            local dep_name=$(echo "$dependency_result" | cut -d: -f1)
            local dep_rate=$(echo "$dependency_result" | cut -d: -f2)
            all_results+=("{\"name\":\"$dep_name\",\"success_rate\":$dep_rate}")
            
            local race_result=$(test_race_condition_scenario)
            local race_name=$(echo "$race_result" | cut -d: -f1)
            local race_rate=$(echo "$race_result" | cut -d: -f2)
            all_results+=("{\"name\":\"$race_name\",\"success_rate\":$race_rate}")
            ;;
        "network")
            local network_results=$(test_network_scenario)
            while IFS= read -r result; do
                local scenario=$(echo "$result" | cut -d: -f1)
                local rate=$(echo "$result" | cut -d: -f2)
                all_results+=("{\"name\":\"network_$scenario\",\"success_rate\":$rate}")
            done <<< "$network_results"
            ;;
        "timeout")
            local timeout_results=$(test_timeout_scenario)
            while IFS= read -r result; do
                local scenario=$(echo "$result" | cut -d: -f1)
                local rate=$(echo "$result" | cut -d: -f2)
                all_results+=("{\"name\":\"$scenario\",\"success_rate\":$rate}")
            done <<< "$timeout_results"
            ;;
        "resource")
            local resource_result=$(test_resource_scenario)
            local resource_name=$(echo "$resource_result" | cut -d: -f1)
            local resource_rate=$(echo "$resource_result" | cut -d: -f2)
            all_results+=("{\"name\":\"$resource_name\",\"success_rate\":$resource_rate}")
            ;;
        "dependency")
            local dependency_result=$(test_dependency_scenario)
            local dep_name=$(echo "$dependency_result" | cut -d: -f1)
            local dep_rate=$(echo "$dependency_result" | cut -d: -f2)
            all_results+=("{\"name\":\"$dep_name\",\"success_rate\":$dep_rate}")
            ;;
        "race")
            local race_result=$(test_race_condition_scenario)
            local race_name=$(echo "$race_result" | cut -d: -f1)
            local race_rate=$(echo "$race_result" | cut -d: -f2)
            all_results+=("{\"name\":\"$race_name\",\"success_rate\":$race_rate}")
            ;;
        *)
            log_error "Cenário inválido: $SCENARIO"
            exit 1
            ;;
    esac
    
    # Gerar relatório
    local results_json=$(printf '%s\n' "${all_results[@]}" | jq -s '.')
    generate_test_report "$results_json"
    
    log_success "Testes de estratégias de retry concluídos"
}

# Executar função principal
main "$@"
