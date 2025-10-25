#!/bin/bash

# Script para detectar projetos com mudanças reais e por linguagem
set -e

# Carregar funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common-functions.sh"

# Parâmetros
ALL_PROJECTS="$1"
BASE_REF="${2:-HEAD~1}"
OUTPUT_FORMAT="${3:-github}"  # github, json, env

# Inicializar variáveis
GO_CHANGED=false
NODE_CHANGED=false
CONFIG_CHANGED=false
SKIP_CI=false
AFFECTED_PROJECTS=""

log_info "Detectando mudanças por linguagem desde $BASE_REF"
log_debug "Formato de output: $OUTPUT_FORMAT"

# Validar pré-requisitos (modo soft para não falhar se ferramentas ausentes)
validate_prerequisites "soft"

# Verificar se há override via commit message
if [ -n "$GITHUB_HEAD_COMMIT_MESSAGE" ]; then
    log_debug "Verificando commit message: $GITHUB_HEAD_COMMIT_MESSAGE"
    
    case "$GITHUB_HEAD_COMMIT_MESSAGE" in
        *"[skip ci]"*|*"[ci skip]"*)
            SKIP_CI=true
            log_info "Commit message indica pular CI"
            ;;
        *"[ci full]"*|*"[ci:full]"*)
            GO_CHANGED=true
            NODE_CHANGED=true
            CONFIG_CHANGED=true
            log_info "Commit message indica forçar tudo"
            ;;
        *"[ci go]"*|*"[ci:go]"*)
            GO_CHANGED=true
            log_info "Commit message indica forçar Go"
            ;;
        *"[ci node]"*|*"[ci:node]"*)
            NODE_CHANGED=true
            log_info "Commit message indica forçar Node.js"
            ;;
    esac
fi

# Se skip-ci foi detectado, sair imediatamente
if [ "$SKIP_CI" = "true" ]; then
    case "$OUTPUT_FORMAT" in
        "github")
            echo "go-changed=false"
            echo "node-changed=false"
            echo "config-changed=false"
            echo "skip-ci=true"
            echo "affected-projects="
            ;;
        "json")
            echo '{"go-changed":false,"node-changed":false,"config-changed":false,"skip-ci":true,"affected-projects":[]}'
            ;;
        "env")
            echo "GO_CHANGED=false"
            echo "NODE_CHANGED=false"
            echo "CONFIG_CHANGED=false"
            echo "SKIP_CI=true"
            echo "AFFECTED_PROJECTS="
            ;;
    esac
    log_success "CI pulado conforme commit message"
    exit 0
fi

# Se já temos mudanças forçadas, pular detecção automática
if [ "$GO_CHANGED" = "true" ] || [ "$NODE_CHANGED" = "true" ] || [ "$CONFIG_CHANGED" = "true" ]; then
    log_info "Mudanças forçadas detectadas, pulando detecção automática"
else
    # Detectar mudanças automaticamente
    log_step "Detectando mudanças automaticamente..."
    
    # Verificar se a base reference existe
    if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
        log_warning "Base reference $BASE_REF não encontrada, usando HEAD~1"
        BASE_REF="HEAD~1"
    fi
    
    # Detectar mudanças em Go
    if git diff --name-only "$BASE_REF" | grep -E '\.(go|mod|sum)$' >/dev/null; then
        GO_CHANGED=true
        log_info "Mudanças em Go detectadas"
    fi
    
    # Detectar mudanças em Node.js/TypeScript
    if git diff --name-only "$BASE_REF" | grep -E '\.(ts|tsx|js|jsx)$' >/dev/null; then
        NODE_CHANGED=true
        log_info "Mudanças em Node.js detectadas"
    fi
    
    # Detectar mudanças em configurações
    if git diff --name-only "$BASE_REF" | grep -E '\.(json|yml|yaml)$' | grep -E '(nx\.json|tsconfig|package\.json|\.github)' >/dev/null; then
        CONFIG_CHANGED=true
        log_info "Mudanças em configurações detectadas"
    fi
    
    # Detectar mudanças em scripts
    if git diff --name-only "$BASE_REF" | grep -E '^scripts/' >/dev/null; then
        CONFIG_CHANGED=true
        log_info "Mudanças em scripts detectadas"
    fi
fi

# Se não há mudanças detectadas, verificar se devemos forçar tudo
if [ "$GO_CHANGED" = "false" ] && [ "$NODE_CHANGED" = "false" ] && [ "$CONFIG_CHANGED" = "false" ]; then
    # Verificar se é um push para main/develop (sempre executar tudo)
    if [ "$GITHUB_REF" = "refs/heads/main" ] || [ "$GITHUB_REF" = "refs/heads/develop" ]; then
        GO_CHANGED=true
        NODE_CHANGED=true
        CONFIG_CHANGED=true
        log_info "Push para branch principal detectado, forçando execução completa"
    else
        log_info "Nenhuma mudança relevante detectada"
    fi
fi

echo "🔍 Detectando projetos com mudanças reais..."

# Verificar se há mudanças usando nx affected
AFFECTED_PROJECTS=$(pnpm nx show projects --affected --base=HEAD~1 2>/dev/null || echo "")

if [ -z "$AFFECTED_PROJECTS" ]; then
    echo "ℹ️ Nenhum projeto afetado encontrado"
    HAS_CHANGES=false
    PUBLISHABLE_CHANGED=""
else
    echo "✅ Projetos afetados encontrados:"
    echo "$AFFECTED_PROJECTS"
fi

# Filtrar apenas os publicáveis que foram afetados
PUBLISHABLE_CHANGED=""
HAS_CHANGES=false

IFS=',' read -ra ALL_PROJECTS_ARRAY <<< "$ALL_PROJECTS"
for project in "${ALL_PROJECTS_ARRAY[@]}"; do
    if [ -n "$project" ]; then
        # Verificar se o projeto está na lista de afetados
        if echo "$AFFECTED_PROJECTS" | grep -q "^$project$"; then
            # Verificar se é publicável
            PROJECT_ROOT=$(pnpm nx show project "$project" --json 2>/dev/null | jq -r '.root' 2>/dev/null || echo "")
            if [ -n "$PROJECT_ROOT" ] && [ -f "$PROJECT_ROOT/package.json" ]; then
                PACKAGE_NAME=$(jq -r '.name' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "")
                if [ -n "$PACKAGE_NAME" ] && [ "$PACKAGE_NAME" != "null" ]; then
                    if [ -z "$PUBLISHABLE_CHANGED" ]; then
                        PUBLISHABLE_CHANGED="$project"
                    else
                        PUBLISHABLE_CHANGED="$PUBLISHABLE_CHANGED,$project"
                    fi
                    HAS_CHANGES=true
                fi
            fi
        fi
    fi
done

# Output baseado no formato solicitado
case "$OUTPUT_FORMAT" in
    "github")
        echo "go-changed=$GO_CHANGED"
        echo "node-changed=$NODE_CHANGED"
        echo "config-changed=$CONFIG_CHANGED"
        echo "skip-ci=$SKIP_CI"
        echo "affected-projects=$AFFECTED_PROJECTS"
        echo "has_changes=$HAS_CHANGES"
        echo "publishable_changed=$PUBLISHABLE_CHANGED"
        ;;
    "json")
        echo "{\"go-changed\":$GO_CHANGED,\"node-changed\":$NODE_CHANGED,\"config-changed\":$CONFIG_CHANGED,\"skip-ci\":$SKIP_CI,\"affected-projects\":\"$AFFECTED_PROJECTS\",\"has_changes\":$HAS_CHANGES,\"publishable_changed\":\"$PUBLISHABLE_CHANGED\"}"
        ;;
    "env")
        echo "GO_CHANGED=$GO_CHANGED"
        echo "NODE_CHANGED=$NODE_CHANGED"
        echo "CONFIG_CHANGED=$CONFIG_CHANGED"
        echo "SKIP_CI=$SKIP_CI"
        echo "AFFECTED_PROJECTS=$AFFECTED_PROJECTS"
        echo "HAS_CHANGES=$HAS_CHANGES"
        echo "PUBLISHABLE_CHANGED=$PUBLISHABLE_CHANGED"
        ;;
    *)
        log_error "Formato de output inválido: $OUTPUT_FORMAT"
        log_info "Formatos suportados: github, json, env"
        exit 1
        ;;
esac

# Log de resumo
log_success "Detecção de mudanças concluída:"
log_info "  Go: $GO_CHANGED"
log_info "  Node.js: $NODE_CHANGED"
log_info "  Config: $CONFIG_CHANGED"
log_info "  Skip CI: $SKIP_CI"

if [ "$HAS_CHANGES" = "true" ]; then
    log_success "Projetos publicáveis com mudanças: $PUBLISHABLE_CHANGED"
else
    log_info "Nenhum projeto publicável com mudanças"
fi
