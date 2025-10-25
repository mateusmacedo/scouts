#!/bin/bash

# Script para estratégia de coverage (affected vs all) - Otimizado
set -e

# Carregar funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/common-functions.sh"

STRATEGY=${1:-affected}
BASE_REF=${2:-origin/main}
PARALLEL=${3:-$(get_dynamic_parallel 4)}

log_info "Executando estratégia de coverage: $STRATEGY"
log_info "Base reference: $BASE_REF"
log_info "Paralelização dinâmica: $PARALLEL"

# Validar pré-requisitos
validate_prerequisites

# Executar health check
run_health_check

# Executar estratégia com retry
if [ "$STRATEGY" = "affected" ]; then
    log_step "Executando testes com coverage para projetos afetados..."
    execute_with_retry 2 5 "pnpm nx affected --target=test --base=\"$BASE_REF\" --parallel=\"$PARALLEL\" --coverage"
elif [ "$STRATEGY" = "all" ]; then
    log_step "Executando testes com coverage para todos os projetos..."
    execute_with_retry 2 5 "pnpm nx run-many --target=test --all --parallel=\"$PARALLEL\" --coverage"
else
    log_error "Estratégia inválida: $STRATEGY"
    log_info "Use: affected ou all"
    exit 1
fi

log_success "Estratégia de coverage concluída"
