#!/bin/bash

# Script de Validação de Workflows GitHub Actions
# Valida sintaxe YAML, secrets, versões de actions e consistência

# Flags de segurança bash completas
set -e          # Exit on error
set -u          # Exit on undefined variable
set -o pipefail # Exit on pipe failure

# Cores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configurações readonly
readonly WORKFLOWS_DIR=".github/workflows"
readonly VALIDATION_REPORT=".github/workflows/VALIDATION_RESULTS.md"

# Variáveis de controle de estado
declare -i TOTAL_ERRORS=0
declare -i TOTAL_WARNINGS=0
DRY_RUN=${DRY_RUN:-false}

#######################################
# Description: Logging functions with context
# Globals: BLUE, GREEN, YELLOW, RED, NC
# Arguments:
#   $1 - Message to log
# Outputs:
#   Formatted log message to stdout
# Returns: 0
#######################################
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

#######################################
# Description: Error handler for critical failures
# Globals: None
# Arguments:
#   $1 - Error message
# Outputs:
#   Error message to stderr
# Returns: 1 (exits script)
#######################################
error_exit() {
    log_error "$1"
    exit 1
}

#######################################
# Description: Track errors and warnings globally
# Globals: TOTAL_ERRORS, TOTAL_WARNINGS
# Arguments: None
# Outputs: None
# Returns: 0
#######################################
track_error() {
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
}

track_warning() {
    TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
}

#######################################
# Description: Cleanup temporary files and state
# Globals: None
# Arguments: None
# Outputs: Cleanup log messages
# Returns: 0
#######################################
cleanup() {
    log "Cleanup completed"
}

# Setup trap handlers
trap cleanup EXIT
trap 'log_error "Script interrupted"; exit 130' INT TERM

#######################################
# Description: Check required dependencies without auto-installation
# Globals: None
# Arguments: None
# Outputs:
#   Prerequisites status to stdout
# Returns:
#   0 if all required deps found, 1 if missing critical deps
#######################################
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_deps=()
    local optional_deps=()
    
    # Required dependencies
    if ! command -v yamllint &> /dev/null; then
        missing_deps+=("yamllint")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    # Optional dependencies
    if ! command -v gh &> /dev/null; then
        optional_deps+=("gh (GitHub CLI)")
    fi
    
    # Report missing required dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Install with: pip install yamllint && apt-get install jq"
        track_error
        return 1
    fi
    
    # Report optional dependencies
    if [ ${#optional_deps[@]} -gt 0 ]; then
        log_warning "Optional dependencies not found: ${optional_deps[*]}"
        log_warning "Some validations will be skipped"
        track_warning
    fi
    
    log_success "Prerequisites check completed"
    return 0
}

#######################################
# Description: Validate YAML syntax using yamllint
# Globals: None
# Arguments:
#   $1 - Workflow file path
# Outputs:
#   Validation results to stdout
# Returns:
#   0 if valid, 1 if errors found
#######################################
validate_yaml_syntax() {
    local file="$1"
    
    # Validate argument
    if [ -z "$file" ]; then
        log_error "validate_yaml_syntax: file argument required"
        track_error
        return 1
    fi
    
    if [ ! -f "$file" ]; then
        log_error "validate_yaml_syntax: file not found: $file"
        track_error
        return 1
    fi
    
    log "Validating YAML syntax for: $file"
    
    if yamllint "$file" > /dev/null 2>&1; then
        log_success "YAML syntax valid: $file"
        return 0
    else
        log_error "YAML syntax errors in: $file"
        yamllint "$file"
        track_error
        return 1
    fi
}

#######################################
# Description: Validate GitHub Actions versions for updates
# Globals: None
# Arguments:
#   $1 - Workflow file path
# Outputs:
#   Version validation results to stdout
# Returns:
#   0 if all actions up to date, 1 if outdated actions found
#######################################
validate_action_versions() {
    local file="$1"
    
    # Validate argument
    if [ -z "$file" ]; then
        log_error "validate_action_versions: file argument required"
        track_error
        return 1
    fi
    
    if [ ! -f "$file" ]; then
        log_error "validate_action_versions: file not found: $file"
        track_error
        return 1
    fi
    
    log "Validating action versions in: $file"
    
    # Lista de actions conhecidas e suas versões mais recentes
    declare -A latest_versions=(
        ["actions/checkout"]="v5"
        ["actions/setup-node"]="v5"
        ["actions/setup-go"]="v5"
        ["actions/cache"]="v4"
        ["pnpm/action-setup"]="v4"
    )
    
    local outdated_count=0
    
    # Extrai actions do arquivo com validação mais robusta
    if ! grep -q 'uses:' "$file"; then
        log_warning "No actions found in: $file"
        return 0
    fi
    
    local actions
    if ! actions=$(grep -o 'uses: [^[:space:]]*' "$file" | sed 's/uses: //' 2>/dev/null); then
        log_warning "Failed to extract actions from: $file"
        return 0
    fi
    
    if [ -z "$actions" ]; then
        log_warning "No valid actions found in: $file"
        return 0
    fi
    
    while IFS= read -r action; do
        if [ -n "$action" ]; then
            local action_name
            local action_version
            action_name=$(echo "$action" | cut -d'@' -f1)
            action_version=$(echo "$action" | cut -d'@' -f2)
            
            if [[ "$action_name" == actions/* ]] || [[ "$action_name" == pnpm/* ]]; then
                local latest_version="${latest_versions[$action_name]}"
                
                if [ -n "$latest_version" ]; then
                    if [ "$action_version" != "$latest_version" ]; then
                        log_warning "Outdated action: $action (current: $action_version, latest: $latest_version)"
                        outdated_count=$((outdated_count + 1))
                        track_warning
                    else
                        log_success "Action up to date: $action"
                    fi
                fi
            fi
        fi
    done <<< "$actions"
    
    if [ $outdated_count -gt 0 ]; then
        return 1
    fi
    
    return 0
}

#######################################
# Description: Validate GitHub secrets usage in workflows
# Globals: None
# Arguments:
#   $1 - Workflow file path
# Outputs:
#   Secret validation results to stdout
# Returns:
#   0 if secrets are properly configured, 1 if issues found
#######################################
validate_secrets() {
    local file="$1"
    
    # Validate argument
    if [ -z "$file" ]; then
        log_error "validate_secrets: file argument required"
        track_error
        return 1
    fi
    
    if [ ! -f "$file" ]; then
        log_error "validate_secrets: file not found: $file"
        track_error
        return 1
    fi
    
    log "Validating secrets in: $file"
    
    # Lista de secrets esperados
    local expected_secrets=("GITHUB_TOKEN" "NPM_TOKEN")
    local issues_found=0
    
    # Extrai secrets do arquivo com validação mais robusta
    local used_secrets
    if ! grep -q "\${{ secrets\." "$file"; then
        log_warning "No secrets found in: $file"
        return 0
    fi
    
    if ! used_secrets=$(grep -o "\${{ secrets\.[^}]* }}" "$file" | sed 's/\${{ secrets\.//g' | sed 's/ }}//g' 2>/dev/null); then
        log_warning "Failed to extract secrets from: $file"
        return 0
    fi
    
    if [ -z "$used_secrets" ]; then
        log_warning "No valid secrets found in: $file"
        return 0
    fi
    
    # Verifica se todos os secrets esperados estão sendo usados
    for secret in "${expected_secrets[@]}"; do
        if echo "$used_secrets" | grep -q "^$secret$"; then
            log_success "Secret found: $secret"
        else
            log_warning "Secret not found: $secret"
            issues_found=$((issues_found + 1))
            track_warning
        fi
    done
    
    # Verifica se há secrets não documentados
    while IFS= read -r secret; do
        if [ -n "$secret" ]; then
            local is_expected=false
            for expected_secret in "${expected_secrets[@]}"; do
                if [ "$secret" = "$expected_secret" ]; then
                    is_expected=true
                    break
                fi
            done
            
            if [ "$is_expected" = "false" ]; then
                log_warning "Unexpected secret: $secret"
                issues_found=$((issues_found + 1))
                track_warning
            fi
        fi
    done <<< "$used_secrets"
    
    if [ $issues_found -gt 0 ]; then
        return 1
    fi
    
    return 0
}

#######################################
# Description: Validate GitHub workflow permissions
# Globals: None
# Arguments:
#   $1 - Workflow file path
# Outputs:
#   Permission validation results to stdout
# Returns:
#   0 if permissions are adequate, 1 if issues found
#######################################
validate_permissions() {
    local file="$1"
    
    # Validate argument
    if [ -z "$file" ]; then
        log_error "validate_permissions: file argument required"
        track_error
        return 1
    fi
    
    if [ ! -f "$file" ]; then
        log_error "validate_permissions: file not found: $file"
        track_error
        return 1
    fi
    
    log "Validating permissions in: $file"
    
    local issues_found=0
    
    # Verifica se há seção de permissions
    if grep -q "permissions:" "$file"; then
        log_success "Permissions section found"
        
        # Verifica permissions específicas
        if grep -q "contents: write" "$file"; then
            log_success "contents: write permission found"
        else
            log_warning "contents: write permission not found (required for releases)"
            issues_found=$((issues_found + 1))
            track_warning
        fi
        
        if grep -q "pull-requests: read" "$file"; then
            log_success "pull-requests: read permission found"
        else
            log_warning "pull-requests: read permission not found"
            issues_found=$((issues_found + 1))
            track_warning
        fi
    else
        log_warning "No permissions section found (using defaults)"
        issues_found=$((issues_found + 1))
        track_warning
    fi
    
    if [ $issues_found -gt 0 ]; then
        return 1
    fi
    
    return 0
}

#######################################
# Description: Validate GitHub workflow triggers
# Globals: None
# Arguments:
#   $1 - Workflow file path
# Outputs:
#   Trigger validation results to stdout
# Returns:
#   0 if triggers are valid, 1 if errors found
#######################################
validate_triggers() {
    local file="$1"
    
    # Validate argument
    if [ -z "$file" ]; then
        log_error "validate_triggers: file argument required"
        track_error
        return 1
    fi
    
    if [ ! -f "$file" ]; then
        log_error "validate_triggers: file not found: $file"
        track_error
        return 1
    fi
    
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
        track_error
        return 1
    fi
    
    return 0
}

#######################################
# Description: Validate consistency between workflows
# Globals: WORKFLOWS_DIR
# Arguments: None
# Outputs:
#   Consistency validation results to stdout
# Returns:
#   0 if consistent, 1 if inconsistencies found
#######################################
validate_consistency() {
    log "Validating consistency between workflows..."
    
    # Validate workflows directory exists
    if [ ! -d "$WORKFLOWS_DIR" ]; then
        log_error "Workflows directory not found: $WORKFLOWS_DIR"
        track_error
        return 1
    fi
    
    local issues_found=0
    
    # Verifica versões de Node.js
    local node_versions
    if grep -r "node-version:" "$WORKFLOWS_DIR" > /dev/null 2>&1; then
        if ! node_versions=$(grep -r "node-version:" "$WORKFLOWS_DIR" | sed 's/.*node-version: *"\([^"]*\)".*/\1/' | sort -u 2>/dev/null); then
            log_warning "Failed to extract Node.js versions"
            node_versions=""
        fi
        local unique_node_versions
        unique_node_versions=$(echo "$node_versions" | wc -l)
        
        if [ "$unique_node_versions" -eq 1 ]; then
            log_success "Node.js version consistent: $(echo "$node_versions" | head -1)"
        else
            log_warning "Node.js version inconsistent: $node_versions"
            issues_found=$((issues_found + 1))
            track_warning
        fi
    else
        log_warning "No Node.js versions found in workflows"
    fi
    
    # Verifica versões de pnpm
    if grep -r "version:" "$WORKFLOWS_DIR" | grep pnpm > /dev/null 2>&1; then
        local pnpm_versions
        if ! pnpm_versions=$(grep -r "version:" "$WORKFLOWS_DIR" | grep pnpm | sed 's/.*version: *\([^[:space:]]*\).*/\1/' | sort -u 2>/dev/null); then
            log_warning "Failed to extract pnpm versions"
            pnpm_versions=""
        fi
        local unique_pnpm_versions
        unique_pnpm_versions=$(echo "$pnpm_versions" | wc -l)
        
        if [ "$unique_pnpm_versions" -eq 1 ]; then
            log_success "pnpm version consistent: $(echo "$pnpm_versions" | head -1)"
        else
            log_warning "pnpm version inconsistent: $pnpm_versions"
            issues_found=$((issues_found + 1))
            track_warning
        fi
    else
        log_warning "No pnpm versions found in workflows"
    fi
    
    # Verifica versões de Go
    if grep -r "go-version:" "$WORKFLOWS_DIR" > /dev/null 2>&1; then
        local go_versions
        if ! go_versions=$(grep -r "go-version:" "$WORKFLOWS_DIR" | sed 's/.*go-version: *"\([^"]*\)".*/\1/' | sort -u 2>/dev/null); then
            log_warning "Failed to extract Go versions"
            go_versions=""
        fi
        local unique_go_versions
        unique_go_versions=$(echo "$go_versions" | wc -l)
        
        if [ "$unique_go_versions" -eq 1 ]; then
            log_success "Go version consistent: $(echo "$go_versions" | head -1)"
        else
            log_warning "Go version inconsistent: $go_versions"
            issues_found=$((issues_found + 1))
            track_warning
        fi
    else
        log_warning "No Go versions found in workflows"
    fi
    
    if [ $issues_found -gt 0 ]; then
        return 1
    fi
    
    return 0
}

#######################################
# Description: Validate Nx specific configurations
# Globals: WORKFLOWS_DIR
# Arguments: None
# Outputs:
#   Nx configuration validation results to stdout
# Returns:
#   0 if Nx properly configured, 1 if issues found
#######################################
validate_nx_configurations() {
    log "Validating Nx specific configurations..."
    
    local issues_found=0
    
    # Verifica se nx.json existe
    if [ -f "nx.json" ]; then
        log_success "nx.json found"
        
        # Verifica se há configuração de cache
        if grep -q "cacheDirectory" nx.json; then
            log_success "Nx cache directory configured"
        else
            log_warning "Nx cache directory not configured"
            issues_found=$((issues_found + 1))
            track_warning
        fi
        
        # Verifica se há namedInputs
        if grep -q "namedInputs" nx.json; then
            log_success "Nx namedInputs configured"
        else
            log_warning "Nx namedInputs not configured"
            issues_found=$((issues_found + 1))
            track_warning
        fi
        
        # Verifica se há targetDefaults
        if grep -q "targetDefaults" nx.json; then
            log_success "Nx targetDefaults configured"
        else
            log_warning "Nx targetDefaults not configured"
            issues_found=$((issues_found + 1))
            track_warning
        fi
    else
        log_error "nx.json not found"
        track_error
        return 1
    fi
    
    # Verifica se há comando nx affected nos workflows
    if [ -d "$WORKFLOWS_DIR" ]; then
        local affected_usage
        if ! affected_usage=$(grep -r "nx affected" "$WORKFLOWS_DIR" 2>/dev/null | wc -l); then
            affected_usage=0
        fi
        if [ "$affected_usage" -gt 0 ]; then
            log_success "nx affected command found in $affected_usage workflow(s)"
        else
            log_warning "nx affected command not found in workflows"
            issues_found=$((issues_found + 1))
            track_warning
        fi
    else
        log_warning "Workflows directory not found for nx affected validation"
        issues_found=$((issues_found + 1))
        track_warning
    fi
    
    if [ $issues_found -gt 0 ]; then
        return 1
    fi
    
    return 0
}

#######################################
# Description: Generate comprehensive validation report
# Globals: WORKFLOWS_DIR, VALIDATION_REPORT, TOTAL_ERRORS, TOTAL_WARNINGS, DRY_RUN
# Arguments: None
# Outputs:
#   Validation report file and summary to stdout
# Returns:
#   0 if all validations passed, 1 if errors found
#######################################
generate_validation_report() {
    log "Generating validation report..."
    
    # Validate workflows directory exists
    if [ ! -d "$WORKFLOWS_DIR" ]; then
        log_error "Workflows directory not found: $WORKFLOWS_DIR"
        track_error
        return 1
    fi
    
    # Reset global counters
    TOTAL_ERRORS=0
    TOTAL_WARNINGS=0
    
    # Generate report header
    if [ "$DRY_RUN" = "false" ]; then
        cat > "$VALIDATION_REPORT" << EOF
# Relatório de Validação - Workflows GitHub Actions

## Data da Validação
$(date)

## Resumo Executivo

EOF
    else
        log "DRY-RUN: Would generate report at: $VALIDATION_REPORT"
    fi

    # Valida cada workflow
    local workflow_count=0
    for workflow_file in "$WORKFLOWS_DIR"/*.yml; do
        if [ -f "$workflow_file" ]; then
            local filename
            filename=$(basename "$workflow_file")
            log "Validating workflow: $filename"
            workflow_count=$((workflow_count + 1))
            
            if [ "$DRY_RUN" = "false" ]; then
                cat >> "$VALIDATION_REPORT" << EOF

### $filename

EOF
            fi
            
            # Validações com rastreamento global
            if ! validate_yaml_syntax "$workflow_file"; then
                # Error already tracked in function
                :
            fi
            
            if ! validate_action_versions "$workflow_file"; then
                # Warning already tracked in function
                :
            fi
            
            if ! validate_secrets "$workflow_file"; then
                # Warning already tracked in function
                :
            fi
            
            if ! validate_permissions "$workflow_file"; then
                # Warning already tracked in function
                :
            fi
            
            if ! validate_triggers "$workflow_file"; then
                # Error already tracked in function
                :
            fi
        fi
    done
    
    if [ $workflow_count -eq 0 ]; then
        log_warning "No workflow files found in: $WORKFLOWS_DIR"
        track_warning
    fi
    
    # Validações globais
    validate_consistency || true  # Tracked in function
    validate_nx_configurations || true  # Tracked in function
    
    # Generate report summary
    if [ "$DRY_RUN" = "false" ]; then
        cat >> "$VALIDATION_REPORT" << EOF

## Resumo da Validação

- **Total de erros:** $TOTAL_ERRORS
- **Total de avisos:** $TOTAL_WARNINGS
- **Status:** $([ $TOTAL_ERRORS -eq 0 ] && echo "✅ Válido" || echo "❌ Com erros")

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
    fi

    log_success "Validation report generated: $VALIDATION_REPORT"
    
    if [ $TOTAL_ERRORS -eq 0 ]; then
        log_success "All workflows passed validation!"
        return 0
    else
        log_error "Workflows have $TOTAL_ERRORS errors that need to be fixed"
        return 1
    fi
}

#######################################
# Description: Main function with dry-run support
# Globals: DRY_RUN, SCRIPT_NAME
# Arguments: Command line arguments
# Outputs:
#   Validation process logs to stdout
# Returns:
#   0 if validation successful, 1 if errors found
#######################################
main() {
    log "GitHub Actions Workflow Validation Tool"
    log "======================================="
    
    if [ "$DRY_RUN" = "true" ]; then
        log "Running in DRY-RUN mode - no files will be modified"
    fi
    
    # Verifica pré-requisitos
    if ! check_prerequisites; then
        error_exit "Prerequisites check failed"
    fi
    
    # Gera relatório de validação
    if ! generate_validation_report; then
        log_error "Validation completed with errors"
        exit 1
    fi
    
    log_success "Validation completed!"
    return 0
}

# Executa o script
main "$@"
