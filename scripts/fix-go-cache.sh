#!/bin/bash

# Script para corrigir problemas de cache Go no CI/CD
set -e

echo "🔧 Corrigindo problemas de cache Go..."

# Verificar se há projetos Go
if [ ! -d "apps/user-go-service" ] && [ ! -d "libs/user-go" ]; then
    echo "ℹ️ Nenhum projeto Go encontrado - pulando correção de cache"
    exit 0
fi

# Criar go.sum na raiz se não existir
if [ ! -f "go.sum" ]; then
    echo "📝 Criando go.sum na raiz do workspace..."
    touch go.sum
fi

# Verificar se há go.work
if [ ! -f "go.work" ]; then
    echo "📝 Criando go.work na raiz do workspace..."
    cat > go.work << EOF
go 1.23

use (
    ./apps/user-go-service
    ./libs/user-go
)
EOF
fi

# Executar go mod tidy em todos os projetos Go
echo "🧹 Executando go mod tidy em todos os projetos Go..."

if [ -d "apps/user-go-service" ]; then
    echo "📦 Processando user-go-service..."
    cd apps/user-go-service
    go mod tidy
    cd ../..
fi

if [ -d "libs/user-go" ]; then
    echo "📦 Processando user-go..."
    cd libs/user-go
    go mod tidy
    cd ../..
fi

# Verificar se go.sum foi criado/atualizado
if [ -f "go.sum" ]; then
    echo "✅ go.sum encontrado na raiz do workspace"
    echo "📊 Conteúdo do go.sum:"
    cat go.sum
else
    echo "⚠️ go.sum não foi criado na raiz"
fi

echo "✅ Correção de cache Go concluída"
