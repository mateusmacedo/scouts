#!/bin/bash

# Script para gerar coverage de Go - Otimizado
set -e

# Carregar funções comuns
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/common-functions.sh"

log_info "Gerando coverage de Go..."

# Verificar se há projetos Go
if [ ! -d "apps/user-go-service" ] && [ ! -d "libs/user-go" ]; then
    log_info "Nenhum projeto Go encontrado - pulando coverage de Go"
    exit 0
fi

# Validar pré-requisitos
validate_prerequisites

# Criar diretório de coverage
mkdir -p coverage/go

# Executar testes Go com coverage
log_step "Executando testes Go com coverage..."

# Projeto user-go-service
if [ -d "apps/user-go-service" ]; then
    log_step "Testando user-go-service..."
    cd apps/user-go-service
    
    # Executar com retry
    if execute_with_retry 2 3 "go test -coverprofile=coverage.out ./..."; then
        if [ -f coverage.out ]; then
            cp coverage.out ../../coverage/go/user-go-service-coverage.out
            log_success "Coverage de user-go-service gerado"
        fi
    else
        log_error "Falha ao gerar coverage de user-go-service"
    fi
    cd ../..
fi

# Projeto user-go (lib)
if [ -d "libs/user-go" ]; then
    log_step "Testando user-go..."
    cd libs/user-go
    
    # Executar com retry
    if execute_with_retry 2 3 "go test -coverprofile=coverage.out ./..."; then
        if [ -f coverage.out ]; then
            cp coverage.out ../../coverage/go/user-go-coverage.out
            log_success "Coverage de user-go gerado"
        fi
    else
        log_error "Falha ao gerar coverage de user-go"
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
