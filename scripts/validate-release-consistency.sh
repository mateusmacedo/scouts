#!/usr/bin/env bash
set -e

echo "🔍 Validação de Consistência de Release"
echo "======================================="

# Verificar se estamos em um branch de release ou main
if [[ ! "$GITHUB_REF" =~ ^refs/heads/(release/|main$) ]]; then
    echo "⚠️  Este script deve ser executado apenas em branches release/** ou main"
    echo "Branch atual: $GITHUB_REF"
    echo "Continuando com validação..."
fi

# Verificar se há mudanças não commitadas (apenas arquivos críticos)
CRITICAL_CHANGES=$(git status --porcelain | grep -E '^ M (package\.json|pnpm-lock\.yaml|go\.mod|go\.sum|nx\.json)')
if [[ -n "$CRITICAL_CHANGES" ]]; then
    echo "❌ Há mudanças críticas não commitadas:"
    echo "$CRITICAL_CHANGES"
    exit 1
fi

# Verificar se pnpm está disponível
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não está instalado"
    exit 1
fi

# Verificar se nx está disponível via pnpm
if ! pnpm exec nx --version > /dev/null 2>&1; then
    echo '? nx não está disponível via pnpm (execute pnpm install para garantir as dependências)'
    exit 1
fi

# Verificar se Go está disponível
if ! command -v go &> /dev/null; then
    echo "❌ go não está instalado"
    exit 1
fi

# Verificar sincronização Go
echo "🔄 Verificando sincronização Go..."
if ! ./scripts/sync-go-versions.sh; then
    echo "❌ Falha na sincronização Go"
    exit 1
fi

# Dry run do nx release
echo "🧪 Executando dry-run do nx release..."
if ! pnpm nx release --dry-run; then
    echo "❌ Dry-run do nx release falhou"
    exit 1
fi

# Verificar consistência de tags
echo "🏷️  Verificando consistência de tags..."
if ! git tag -l | grep -q "@scouts/"; then
    echo "ℹ️  Nenhuma tag @scouts/* encontrada (OK para primeira release)"
else
    echo "ℹ️  Tags @scouts/* encontradas:"
    git tag -l | grep "@scouts/"
fi

# Verificar configuração Nx
echo "⚙️  Verificando configuração Nx..."
if ! pnpm nx show projects --json > /dev/null; then
    echo "❌ Falha ao listar projetos Nx"
    exit 1
fi

echo "✅ Validação de consistência concluída com sucesso"

