#!/bin/bash

# Script para estratégia de coverage (affected vs all)
set -e

STRATEGY=${1:-affected}
BASE_REF=${2:-origin/main}
PARALLEL=${3:-3}

echo "📊 Executando estratégia de coverage: $STRATEGY"
echo "🔍 Base reference: $BASE_REF"
echo "⚡ Paralelização: $PARALLEL"

if [ "$STRATEGY" = "affected" ]; then
    echo "🎯 Executando testes com coverage para projetos afetados..."
    pnpm nx affected --target=test --base="$BASE_REF" --parallel="$PARALLEL" --coverage
elif [ "$STRATEGY" = "all" ]; then
    echo "🌐 Executando testes com coverage para todos os projetos..."
    pnpm nx run-many --target=test --all --parallel="$PARALLEL" --coverage
else
    echo "❌ Estratégia inválida: $STRATEGY"
    echo "💡 Use: affected ou all"
    exit 1
fi

echo "✅ Estratégia de coverage concluída"
