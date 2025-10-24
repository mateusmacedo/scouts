#!/bin/bash

# Script de Validação de Workflows GitHub Actions
# Valida sintaxe YAML, secrets, versões de actions e consistência

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
WORKFLOWS_DIR=".github/workflows"
VALIDATION_REPORT=".github/workflows/VALIDATION_RESULTS.md"

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

# Função para verificar pré-requisitos
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Verifica se yamllint está instalado
    if ! command -v yamllint &> /dev/null; then
        log_warning "yamllint not found. Installing via pip..."
        pip install yamllint
    fi
    
    # Verifica se gh CLI está instalado
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI (gh) not found. Some validations will be skipped."
    fi
    
    # Verifica se jq está instalado
    if ! command -v jq &> /dev/null; then
        log_warning "jq not found. Some validations will be skipped."
    fi
    
    log_success "Prerequisites check completed"
}

# Função para validar sintaxe YAML
validate_yaml_syntax() {
    local file="$1"
    local errors=0
    
    log "Validating YAML syntax for: $file"
    
    if yamllint "$file" > /dev/null 2>&1; then
        log_success "YAML syntax valid: $file"
    else
        log_error "YAML syntax errors in: $file"
        yamllint "$file"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Função para validar versões de actions
validate_action_versions() {
    local file="$1"
    local errors=0
    
    log "Validating action versions in: $file"
    
    # Lista de actions conhecidas e suas versões mais recentes
    declare -A latest_versions=(
        ["actions/checkout"]="v5"
        ["actions/setup-node"]="v5"
        ["actions/setup-go"]="v5"
        ["actions/cache"]="v4"
        ["pnpm/action-setup"]="v4"
    )
    
    # Extrai actions do arquivo
    local actions=$(grep -o 'uses: [^[:space:]]*' "$file" | sed 's/uses: //')
    
    while IFS= read -r action; do
        if [ -n "$action" ]; then
            local action_name=$(echo "$action" | cut -d'@' -f1)
            local action_version=$(echo "$action" | cut -d'@' -f2)
            
            if [[ "$action_name" == actions/* ]] || [[ "$action_name" == pnpm/* ]]; then
                local latest_version="${latest_versions[$action_name]}"
                
                if [ -n "$latest_version" ]; then
                    if [ "$action_version" != "$latest_version" ]; then
                        log_warning "Outdated action: $action (current: $action_version, latest: $latest_version)"
                    else
                        log_success "Action up to date: $action"
                    fi
                fi
            fi
        fi
    done <<< "$actions"
    
    return $errors
}

# Função para validar secrets
validate_secrets() {
    local file="$1"
    local errors=0
    
    log "Validating secrets in: $file"
    
    # Lista de secrets esperados
    local expected_secrets=("GITHUB_TOKEN" "NPM_TOKEN")
    
    # Extrai secrets do arquivo
    local used_secrets=$(grep -o '\${{ secrets\.[^}]* }}' "$file" | sed 's/\${{ secrets\.//g' | sed 's/ }}//g')
    
    # Verifica se todos os secrets esperados estão sendo usados
    for secret in "${expected_secrets[@]}"; do
        if echo "$used_secrets" | grep -q "^$secret$"; then
            log_success "Secret found: $secret"
        else
            log_warning "Secret not found: $secret"
        fi
    done
    
    # Verifica se há secrets não documentados
    while IFS= read -r secret; do
        if [ -n "$secret" ]; then
            if [[ ! " ${expected_secrets[@]} " =~ " ${secret} " ]]; then
                log_warning "Unexpected secret: $secret"
            fi
        fi
    done <<< "$used_secrets"
    
    return $errors
}

# Função para validar permissions
validate_permissions() {
    local file="$1"
    local errors=0
    
    log "Validating permissions in: $file"
    
    # Verifica se há seção de permissions
    if grep -q "permissions:" "$file"; then
        log_success "Permissions section found"
        
        # Verifica permissions específicas
        if grep -q "contents: write" "$file"; then
            log_success "contents: write permission found"
        else
            log_warning "contents: write permission not found (required for releases)"
        fi
        
        if grep -q "pull-requests: read" "$file"; then
            log_success "pull-requests: read permission found"
        else
            log_warning "pull-requests: read permission not found"
        fi
    else
        log_warning "No permissions section found (using defaults)"
    fi
    
    return $errors
}

# Função para validar triggers
validate_triggers() {
    local file="$1"
    local errors=0
    
    log "Validating triggers in: $file"
    
    # Verifica se há seção on
    if grep -q "^on:" "$file"; then
        log_success "Triggers section found"
        
        # Verifica triggers específicos
        if grep -q "push:" "$file"; then
            log_success "push trigger found"
        fi
        
        if grep -q "pull_request:" "$file"; then
            log_success "pull_request trigger found"
        fi
        
        if grep -q "workflow_dispatch:" "$file"; then
            log_success "workflow_dispatch trigger found"
        fi
    else
        log_error "No triggers section found"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Função para validar consistência entre workflows
validate_consistency() {
    local errors=0
    
    log "Validating consistency between workflows..."
    
    # Verifica versões de Node.js
    local node_versions=$(grep -r "node-version:" "$WORKFLOWS_DIR" | sed 's/.*node-version: *"\([^"]*\)".*/\1/' | sort -u)
    local unique_node_versions=$(echo "$node_versions" | wc -l)
    
    if [ "$unique_node_versions" -eq 1 ]; then
        log_success "Node.js version consistent: $(echo "$node_versions" | head -1)"
    else
        log_warning "Node.js version inconsistent: $node_versions"
    fi
    
    # Verifica versões de pnpm
    local pnpm_versions=$(grep -r "version:" "$WORKFLOWS_DIR" | grep pnpm | sed 's/.*version: *\([^[:space:]]*\).*/\1/' | sort -u)
    local unique_pnpm_versions=$(echo "$pnpm_versions" | wc -l)
    
    if [ "$unique_pnpm_versions" -eq 1 ]; then
        log_success "pnpm version consistent: $(echo "$pnpm_versions" | head -1)"
    else
        log_warning "pnpm version inconsistent: $pnpm_versions"
    fi
    
    # Verifica versões de Go
    local go_versions=$(grep -r "go-version:" "$WORKFLOWS_DIR" | sed 's/.*go-version: *"\([^"]*\)".*/\1/' | sort -u)
    local unique_go_versions=$(echo "$go_versions" | wc -l)
    
    if [ "$unique_go_versions" -eq 1 ]; then
        log_success "Go version consistent: $(echo "$go_versions" | head -1)"
    else
        log_warning "Go version inconsistent: $go_versions"
    fi
    
    return $errors
}

# Função para validar Nx specific configurations
validate_nx_configurations() {
    local errors=0
    
    log "Validating Nx specific configurations..."
    
    # Verifica se nx.json existe
    if [ -f "nx.json" ]; then
        log_success "nx.json found"
        
        # Verifica se há configuração de cache
        if grep -q "cacheDirectory" nx.json; then
            log_success "Nx cache directory configured"
        else
            log_warning "Nx cache directory not configured"
        fi
        
        # Verifica se há namedInputs
        if grep -q "namedInputs" nx.json; then
            log_success "Nx namedInputs configured"
        else
            log_warning "Nx namedInputs not configured"
        fi
        
        # Verifica se há targetDefaults
        if grep -q "targetDefaults" nx.json; then
            log_success "Nx targetDefaults configured"
        else
            log_warning "Nx targetDefaults not configured"
        fi
    else
        log_error "nx.json not found"
        errors=$((errors + 1))
    fi
    
    # Verifica se há comando nx affected nos workflows
    local affected_usage=$(grep -r "nx affected" "$WORKFLOWS_DIR" | wc -l)
    if [ "$affected_usage" -gt 0 ]; then
        log_success "nx affected command found in $affected_usage workflow(s)"
    else
        log_warning "nx affected command not found in workflows"
    fi
    
    return $errors
}

# Função para gerar relatório de validação
generate_validation_report() {
    local total_errors=0
    local total_warnings=0
    
    log "Generating validation report..."
    
    cat > "$VALIDATION_REPORT" << EOF
# Relatório de Validação - Workflows GitHub Actions

## Data da Validação
$(date)

## Resumo Executivo

EOF

    # Valida cada workflow
    for workflow_file in "$WORKFLOWS_DIR"/*.yml; do
        if [ -f "$workflow_file" ]; then
            local filename=$(basename "$workflow_file")
            log "Validating workflow: $filename"
            
            cat >> "$VALIDATION_REPORT" << EOF

### $filename

EOF
            
            # Validações
            validate_yaml_syntax "$workflow_file" || total_errors=$((total_errors + 1))
            validate_action_versions "$workflow_file" || total_warnings=$((total_warnings + 1))
            validate_secrets "$workflow_file" || total_warnings=$((total_warnings + 1))
            validate_permissions "$workflow_file" || total_warnings=$((total_warnings + 1))
            validate_triggers "$workflow_file" || total_errors=$((total_errors + 1))
        fi
    done
    
    # Validações globais
    validate_consistency || total_warnings=$((total_warnings + 1))
    validate_nx_configurations || total_errors=$((total_errors + 1))
    
    # Adiciona resumo ao relatório
    cat >> "$VALIDATION_REPORT" << EOF

## Resumo da Validação

- **Total de erros:** $total_errors
- **Total de avisos:** $total_warnings
- **Status:** $([ $total_errors -eq 0 ] && echo "✅ Válido" || echo "❌ Com erros")

## Recomendações

### Ações Imediatas
1. **Corrigir erros críticos** (se houver)
2. **Atualizar actions** para versões mais recentes
3. **Implementar permissions** explícitas
4. **Configurar Nx affected** com base/head refs

### Melhorias Futuras
1. **Implementar Nx cache** persistence
2. **Adicionar paralelização** de tasks
3. **Configurar concurrency groups**
4. **Implementar conditional execution**

EOF

    log_success "Validation report generated: $VALIDATION_REPORT"
    
    if [ $total_errors -eq 0 ]; then
        log_success "All workflows passed validation!"
    else
        log_error "Workflows have $total_errors errors that need to be fixed"
    fi
    
    return $total_errors
}

# Função principal
main() {
    log "GitHub Actions Workflow Validation Tool"
    log "======================================="
    
    # Verifica pré-requisitos
    check_prerequisites
    
    # Gera relatório de validação
    generate_validation_report
    
    log_success "Validation completed!"
}

# Executa o script
main "$@"
