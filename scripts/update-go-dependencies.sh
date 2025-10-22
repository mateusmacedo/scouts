#!/usr/bin/env bash

# Script para atualizar dependências Go após release
# Este script atualiza o go.mod do user-go-service com a nova versão da lib user-go

echo "🔄 Atualizando dependências Go..."

# Extrair versão do package.json da lib user-go
GO_USER_VERSION=$(node -p "require('./libs/user-go/package.json').version")
echo "📦 Versão da lib user-go: $GO_USER_VERSION"

# Atualizar go.mod do user-go-service
echo "🔧 Atualizando go.mod do user-go-service..."
cd apps/user-go-service

# Atualizar require no go.mod
sed -i "s|require github.com/mateusmacedo/scouts/libs/user-go v.*|require github.com/mateusmacedo/scouts/libs/user-go v${GO_USER_VERSION}|g" go.mod

# Executar go mod tidy
echo "🧹 Executando go mod tidy..."
go mod tidy

cd ../..

# Verificar se há mudanças
if [[ -n $(git status -s) ]]; then
    echo "📝 Mudanças detectadas, fazendo commit..."
    git add apps/user-go-service/go.mod apps/user-go-service/go.sum
    git commit -m "chore(user-go-service): update user-go dependency to v${GO_USER_VERSION}"
    echo "✅ Commit realizado: chore(user-go-service): update user-go dependency to v${GO_USER_VERSION}"
else
    echo "ℹ️  Nenhuma mudança detectada"
fi

echo "🎉 Dependências Go atualizadas com sucesso!"
