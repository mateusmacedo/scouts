#!/bin/bash

# Script para obter projetos publicáveis do workspace
set -e

echo "📦 Obtendo projetos publicáveis..."

# Usar configuração do nx.json para projetos de release
ALL_PROJECTS=$(jq -r '.release.projects | join(",")' nx.json 2>/dev/null || echo "")

if [ -n "$ALL_PROJECTS" ]; then
    echo "✅ Projetos de release encontrados:"
    echo "$ALL_PROJECTS" | tr ',' '\n'
    
    # Filtrar apenas os publicáveis (que têm package.json com name)
    PUBLISHABLE_PROJECTS=""
    IFS=',' read -ra PROJECTS <<< "$ALL_PROJECTS"
    
    for project in "${PROJECTS[@]}"; do
        if [ -n "$project" ]; then
            # Verificar se o projeto tem package.json
            PROJECT_ROOT=$(pnpm nx show project "$project" --json 2>/dev/null | jq -r '.root' 2>/dev/null || echo "")
            if [ -n "$PROJECT_ROOT" ] && [ -f "$PROJECT_ROOT/package.json" ]; then
                # Verificar se tem campo "name" (não é private)
                PACKAGE_NAME=$(jq -r '.name' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "")
                if [ -n "$PACKAGE_NAME" ] && [ "$PACKAGE_NAME" != "null" ]; then
                    if [ -z "$PUBLISHABLE_PROJECTS" ]; then
                        PUBLISHABLE_PROJECTS="$project"
                    else
                        PUBLISHABLE_PROJECTS="$PUBLISHABLE_PROJECTS,$project"
                    fi
                fi
            fi
        fi
    done
    
    if [ -n "$PUBLISHABLE_PROJECTS" ]; then
        echo "publishable=$PUBLISHABLE_PROJECTS"
        echo "✅ Projetos publicáveis: $PUBLISHABLE_PROJECTS"
    else
        echo "publishable="
        echo "ℹ️ Nenhum projeto publicável encontrado"
    fi
else
    echo "publishable="
    echo "ℹ️ Nenhum projeto de release configurado"
fi
