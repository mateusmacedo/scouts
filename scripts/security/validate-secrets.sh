#!/bin/bash

# Script para validar secrets obrigatórios do CI/CD
set -e

echo "🔐 Validando secrets obrigatórios..."

# Lista de secrets obrigatórios
REQUIRED_SECRETS=(
    "GL_TOKEN"
    "NPM_TOKEN" 
    "SONAR_TOKEN"
)

MISSING_SECRETS=()

# Verificar cada secret
for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ -z "${!secret}" ]; then
        echo "❌ Secret $secret não encontrado"
        MISSING_SECRETS+=("$secret")
    else
        echo "✅ Secret $secret configurado"
    fi
done

# Verificar se há secrets faltando
if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo "❌ Secrets obrigatórios não encontrados:"
    printf '  - %s\n' "${MISSING_SECRETS[@]}"
    echo ""
    echo "💡 Configure os secrets no repositório GitHub:"
    echo "   Settings > Secrets and variables > Actions"
    exit 1
fi

echo "✅ Todos os secrets obrigatórios estão configurados"
