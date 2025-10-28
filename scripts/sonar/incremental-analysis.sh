#!/bin/bash

# Script para análise incremental do SonarCloud
set -e

echo "⚡ Executando análise incremental do SonarCloud..."

# Configurar variáveis do SonarCloud
export SONAR_HOST_URL="https://sonarcloud.io"
export SONAR_TOKEN="$SONAR_TOKEN"

# Verificar se o token está configurado
if [ -z "$SONAR_TOKEN" ]; then
    echo "❌ SONAR_TOKEN não configurado"
    exit 1
fi

# Executar análise incremental
echo "🔍 Executando análise SonarCloud incremental..."
npx sonar-scanner \
    -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
    -Dsonar.organization="$SONAR_ORGANIZATION" \
    -Dsonar.host.url="$SONAR_HOST_URL" \
    -Dsonar.token="$SONAR_TOKEN" \
    -Dsonar.sources=apps,libs \
    -Dsonar.exclusions="**/node_modules/**,**/dist/**,**/*.spec.ts,**/*.test.ts" \
    -Dsonar.javascript.lcov.reportPaths=coverage/consolidated/consolidated.info \
    -Dsonar.typescript.lcov.reportPaths=coverage/consolidated/consolidated.info \
    -Dsonar.go.coverage.reportPaths=coverage/go/go-coverage.out \
    -Dsonar.qualitygate.wait=false

echo "✅ Análise incremental do SonarCloud concluída"
