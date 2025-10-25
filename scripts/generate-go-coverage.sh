#!/bin/bash

# Script para gerar coverage de Go
set -e

echo "🔧 Gerando coverage de Go..."

# Verificar se há projetos Go
if [ ! -d "apps/user-go-service" ] && [ ! -d "libs/user-go" ]; then
    echo "ℹ️ Nenhum projeto Go encontrado - pulando coverage de Go"
    exit 0
fi

# Criar diretório de coverage
mkdir -p coverage/go

# Executar testes Go com coverage
echo "🧪 Executando testes Go com coverage..."

# Projeto user-go-service
if [ -d "apps/user-go-service" ]; then
    echo "📦 Testando user-go-service..."
    cd apps/user-go-service
    go test -coverprofile=coverage.out ./...
    if [ -f coverage.out ]; then
        cp coverage.out ../../coverage/go/user-go-service-coverage.out
        echo "✅ Coverage de user-go-service gerado"
    fi
    cd ../..
fi

# Projeto user-go (lib)
if [ -d "libs/user-go" ]; then
    echo "📦 Testando user-go..."
    cd libs/user-go
    go test -coverprofile=coverage.out ./...
    if [ -f coverage.out ]; then
        cp coverage.out ../../coverage/go/user-go-coverage.out
        echo "✅ Coverage de user-go gerado"
    fi
    cd ../..
fi

# Consolidar coverage Go
if [ -f "coverage/go/user-go-service-coverage.out" ] || [ -f "coverage/go/user-go-coverage.out" ]; then
    echo "📊 Consolidando coverage Go..."
    
    # Criar arquivo consolidado
    echo "mode: set" > coverage/go/go-coverage.out
    
    # Adicionar coverage de cada projeto
    for coverage_file in coverage/go/*-coverage.out; do
        if [ -f "$coverage_file" ]; then
            tail -n +2 "$coverage_file" >> coverage/go/go-coverage.out
        fi
    done
    
    echo "✅ Coverage Go consolidado: coverage/go/go-coverage.out"
else
    echo "⚠️ Nenhum coverage Go gerado"
fi

echo "✅ Geração de coverage Go concluída"
