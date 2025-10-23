#!/usr/bin/env bash

# Script para testar a configuração de release
# Este script valida se a configuração do Nx Release está funcionando corretamente

echo "🔍 Validando configuração do Nx Release..."

# Verificar se o Nx está instalado
if ! command -v nx &> /dev/null; then
    echo "❌ Nx não encontrado. Instalando dependências..."
    pnpm install
fi

# Verificar configuração do nx.json
echo "📋 Verificando configuração do nx.json..."
if grep -q "projectsRelationship.*independent" nx.json; then
    echo "✅ Configuração de release independente encontrada"
else
    echo "❌ Configuração de release independente não encontrada"
    exit 1
fi

if grep -q "releaseTagPattern.*{projectName}@v{version}" nx.json; then
    echo "✅ Padrão de tags configurado corretamente"
else
    echo "❌ Padrão de tags não configurado"
    exit 1
fi

# Verificar se os projetos estão configurados
echo "📦 Verificando projetos..."
PROJECTS=("@scouts/utils-nest" "@scouts/user-node" "scouts/user-go" "@scouts/bff-nest" "scouts/user-go-service")

for project in "${PROJECTS[@]}"; do
    if [ -d "libs/${project#@scouts/}" ] || [ -d "apps/${project#@scouts/}" ]; then
        echo "✅ Projeto $project encontrado"
    else
        echo "⚠️  Projeto $project não encontrado"
    fi
done

# Verificar go.mod paths
echo "🔧 Verificando module paths do Go..."
if grep -q "github.com/mateusmacedo/scouts" libs/user-go/go.mod; then
    echo "✅ Module path da lib user-go configurado corretamente"
else
    echo "❌ Module path da lib user-go não configurado"
fi

if grep -q "github.com/mateusmacedo/scouts" apps/user-go-service/go.mod; then
    echo "✅ Module path do app user-go-service configurado corretamente"
else
    echo "❌ Module path do app user-go-service não configurado"
fi

# Testar build
echo "🔨 Testando build dos projetos..."
if pnpm nx run-many -t build --parallel=3; then
    echo "✅ Build executado com sucesso"
else
    echo "❌ Erro no build"
    exit 1
fi

# Testar dry-run do release
echo "🧪 Testando dry-run do release..."
if pnpm nx release --dry-run; then
    echo "✅ Dry-run executado com sucesso"
else
    echo "❌ Erro no dry-run do release"
    exit 1
fi

echo "🎉 Configuração do Nx Release validada com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Execute: pnpm nx release --skip-publish"
echo "2. Atualize manualmente o go.mod do user-go-service"
echo "3. Execute: pnpm nx release publish"
echo "4. Faça push das mudanças e tags"
