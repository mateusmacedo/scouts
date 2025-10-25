#!/bin/bash

# Script para diagnosticar problemas de teste
set -e

echo "🔍 Diagnosticando problemas de teste..."

# Verificar se estamos em um ambiente CI
if [ "$CI" = "true" ]; then
    echo "✅ Ambiente CI detectado"
else
    echo "⚠️ Executando em ambiente local"
fi

# Testar projetos Node.js individualmente
echo "🧪 Testando projetos Node.js individualmente..."

echo "📦 Testando @scouts/bff-nest..."
pnpm nx run @scouts/bff-nest:test || echo "❌ Falha em @scouts/bff-nest"

echo "📦 Testando express-notifier..."
pnpm nx run express-notifier:test || echo "❌ Falha em express-notifier"

echo "📦 Testando @scouts/logger-node..."
pnpm nx run @scouts/logger-node:test || echo "❌ Falha em @scouts/logger-node"

echo "📦 Testando @scouts/user-node..."
pnpm nx run @scouts/user-node:test || echo "❌ Falha em @scouts/user-node"

echo "📦 Testando @scouts/utils-nest..."
pnpm nx run @scouts/utils-nest:test || echo "❌ Falha em @scouts/utils-nest"

# Testar projetos Go individualmente
echo "🧪 Testando projetos Go individualmente..."

echo "📦 Testando scouts/user-go-service..."
pnpm nx run scouts/user-go-service:test || echo "❌ Falha em scouts/user-go-service"

echo "📦 Testando scouts/user-go..."
pnpm nx run scouts/user-go:test || echo "❌ Falha em scouts/user-go"

echo "✅ Diagnóstico concluído"
