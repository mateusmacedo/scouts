#!/usr/bin/env bash
set -e

echo "🔍 Validação de Consistência de Release"
echo "======================================="

# Verificar se estamos em um branch de release ou main
if [[ ! "$GITHUB_REF" =~ ^refs/heads/(release/|main$) ]]; then
    echo "⚠️  Este script deve ser executado apenas em branches release/** ou main"
    echo "Branch atual: $GITHUB_REF"
    echo "Continuando com validação..."
fi

# Lista de padrões de arquivos/diretórios permitidos para mudanças
# - Documentação e guias
# - Arquivos de configuração do editor/IDE
# - Arquivos de permissão de scripts (mode-only changes)
ALLOWED_PATTERNS=(
    "^AGENTS.md"
    "^README.md"
    "^\.cursor/"
    "^\.vscode/"
    "^\.editorconfig"
    "^\.gemini/"
    "^docs/"
    "^scripts/.*\.sh$"
)

# Função para verificar se um arquivo corresponde aos padrões permitidos
is_allowed_change() {
    local file="$1"
    for pattern in "${ALLOWED_PATTERNS[@]}"; do
        if [[ "$file" =~ $pattern ]]; then
            return 0
        fi
    done
    return 1
}

# Verificar se há mudanças não commitadas
PORCELAIN_OUTPUT=$(git status --porcelain)
if [[ -n "$PORCELAIN_OUTPUT" ]]; then
    echo "⚠️  Detectadas mudanças não commitadas:"
    echo "$PORCELAIN_OUTPUT"
    echo ""
    
    # Filtrar mudanças críticas (excluindo arquivos permitidos)
    CRITICAL_CHANGES=""
    while IFS= read -r line; do
        # Extrair o nome do arquivo (remover o prefixo de status)
        file=$(echo "$line" | sed 's/^...//g')
        
        # Verificar se é uma mudança permitida
        if ! is_allowed_change "$file"; then
            CRITICAL_CHANGES="${CRITICAL_CHANGES}${line}\n"
        else
            echo "ℹ️  Mudança permitida: $file"
        fi
    done <<< "$PORCELAIN_OUTPUT"
    
    # Se houver mudanças críticas, falhar
    if [[ -n "$CRITICAL_CHANGES" ]]; then
        echo ""
        echo "❌ Há mudanças críticas não commitadas:"
        echo -e "$CRITICAL_CHANGES"
        exit 1
    fi
    
    echo ""
    echo "✅ Todas as mudanças detectadas são permitidas"
fi

# Verificar se pnpm está disponível
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não está instalado"
    exit 1
fi

# Verificar se nx está disponível
if ! command -v nx &> /dev/null; then
    echo "❌ nx não está instalado"
    exit 1
fi

# Verificar se Go está disponível
if ! command -v go &> /dev/null; then
    echo "❌ go não está instalado"
    exit 1
fi

# Verificar sincronização Go
echo "🔄 Verificando sincronização Go..."
if ! ./scripts/sync-go-versions.sh; then
    echo "❌ Falha na sincronização Go"
    exit 1
fi

# Dry run do nx release
echo "🧪 Executando dry-run do nx release..."
if ! pnpm nx release --dry-run; then
    echo "❌ Dry-run do nx release falhou"
    exit 1
fi

# Verificar consistência de tags
echo "🏷️  Verificando consistência de tags..."
if ! git tag -l | grep -q "@scouts/"; then
    echo "ℹ️  Nenhuma tag @scouts/* encontrada (OK para primeira release)"
else
    echo "ℹ️  Tags @scouts/* encontradas:"
    git tag -l | grep "@scouts/"
fi

# Verificar configuração Nx
echo "⚙️  Verificando configuração Nx..."
if ! pnpm nx show projects --json > /dev/null; then
    echo "❌ Falha ao listar projetos Nx"
    exit 1
fi

echo "✅ Validação de consistência concluída com sucesso"