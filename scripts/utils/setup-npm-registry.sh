#!/bin/bash

# Script centralizado para configuração do registry npm
# Modo: ci (leitura) ou release (publicação)

set -e

MODE=${1:-ci}
REGISTRY_URL="https://registry.npmjs.org/"

echo "🔧 Configurando registry npm para modo: $MODE"

if [ "$MODE" = "release" ]; then
    echo "📦 Configurando para publicação no npmjs.org..."
    
    # Configurar registry para publicação
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > $HOME/.npmrc
    chmod 600 $HOME/.npmrc
    
    # Configurar pnpm para usar o mesmo registry
    pnpm config set registry $REGISTRY_URL
    
    echo "✅ Registry configurado para publicação: $REGISTRY_URL"
    echo "🔐 Token configurado para autenticação"
    
elif [ "$MODE" = "ci" ]; then
    echo "📖 Configurando para leitura (CI)..."
    
    # Configurar registry para leitura (sem token)
    pnpm config set registry $REGISTRY_URL
    
    echo "✅ Registry configurado para leitura: $REGISTRY_URL"
    
else
    echo "❌ Modo inválido: $MODE"
    echo "💡 Use: ci (leitura) ou release (publicação)"
    exit 1
fi

# Verificar configuração
echo "🔍 Verificando configuração do registry..."
pnpm config get registry

echo "✅ Configuração do registry npm concluída"
