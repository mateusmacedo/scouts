#!/bin/bash

# Script para verificar conflitos de publicação
set -e

PROJECT_NAME="$1"

if [ -z "$PROJECT_NAME" ]; then
    echo "❌ Nome do projeto não fornecido"
    exit 1
fi

echo "🔍 Verificando conflitos de publicação para: $PROJECT_NAME"

# Obter informações do projeto
PROJECT_ROOT=$(pnpm nx show project "$PROJECT_NAME" --json 2>/dev/null | jq -r '.root' 2>/dev/null || echo "")

if [ -z "$PROJECT_ROOT" ] || [ "$PROJECT_ROOT" = "null" ]; then
    echo "❌ Projeto não encontrado: $PROJECT_NAME"
    exit 1
fi

# Verificar se package.json existe
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo "❌ package.json não encontrado em $PROJECT_ROOT"
    exit 1
fi

# Obter nome e versão do pacote
PACKAGE_NAME=$(jq -r '.name' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "")
PACKAGE_VERSION=$(jq -r '.version' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "")

if [ -z "$PACKAGE_NAME" ] || [ "$PACKAGE_NAME" = "null" ]; then
    echo "❌ Nome do pacote não encontrado em package.json"
    exit 1
fi

echo "📦 Pacote: $PACKAGE_NAME@$PACKAGE_VERSION"

# Verificar se o pacote já existe no registry
echo "🔍 Verificando se o pacote já existe no registry..."
if npm view "$PACKAGE_NAME" version > /dev/null 2>&1; then
    EXISTING_VERSION=$(npm view "$PACKAGE_NAME" version 2>/dev/null || echo "")
    echo "⚠️ Pacote já existe no registry: $PACKAGE_NAME@$EXISTING_VERSION"
    
    if [ "$PACKAGE_VERSION" = "$EXISTING_VERSION" ]; then
        echo "❌ Conflito: versão $PACKAGE_VERSION já existe no registry"
        exit 1
    else
        echo "✅ Versão $PACKAGE_VERSION é diferente da existente ($EXISTING_VERSION)"
        exit 0
    fi
else
    echo "✅ Pacote não existe no registry - OK para publicar"
    exit 0
fi
