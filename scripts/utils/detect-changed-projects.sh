#!/bin/bash

# Script para detectar projetos com mudanças reais
set -e

ALL_PROJECTS="$1"

if [ -z "$ALL_PROJECTS" ]; then
    echo "❌ Lista de projetos não fornecida"
    exit 1
fi

echo "🔍 Detectando projetos com mudanças reais..."

# Verificar se há mudanças usando nx affected
AFFECTED_PROJECTS=$(pnpm nx show projects --affected --base=HEAD~1 2>/dev/null || echo "")

if [ -z "$AFFECTED_PROJECTS" ]; then
    echo "has_changes=false"
    echo "publishable_changed="
    echo "ℹ️ Nenhum projeto afetado encontrado"
    exit 0
fi

echo "✅ Projetos afetados encontrados:"
echo "$AFFECTED_PROJECTS"

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

echo "has_changes=$HAS_CHANGES"
echo "publishable_changed=$PUBLISHABLE_CHANGED"

if [ "$HAS_CHANGES" = "true" ]; then
    echo "✅ Projetos publicáveis com mudanças: $PUBLISHABLE_CHANGED"
else
    echo "ℹ️ Nenhum projeto publicável com mudanças"
fi
