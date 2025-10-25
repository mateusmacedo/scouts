#!/bin/bash

# Script para health check de serviços externos do CI/CD
set -e

echo "🏥 Executando health checks de serviços externos..."

# Health check do SonarCloud
if [ -n "$SONARQUBE_HOST" ]; then
    echo "🔍 Verificando conectividade com SonarCloud..."
    if curl -s --connect-timeout 10 "$SONARQUBE_HOST" > /dev/null; then
        echo "✅ SonarCloud acessível"
    else
        echo "⚠️ SonarCloud não acessível (continuando sem análise)"
    fi
else
    echo "ℹ️ SONARQUBE_HOST não configurado - pulando health check do SonarCloud"
fi

# Health check do npm registry
echo "🔍 Verificando conectividade com npm registry..."
if curl -s --connect-timeout 10 "https://registry.npmjs.org/" > /dev/null; then
    echo "✅ npm registry acessível"
else
    echo "⚠️ npm registry não acessível"
fi

# Health check do GitHub API
echo "🔍 Verificando conectividade com GitHub API..."
if curl -s --connect-timeout 10 "https://api.github.com" > /dev/null; then
    echo "✅ GitHub API acessível"
else
    echo "⚠️ GitHub API não acessível"
fi

echo "✅ Health checks concluídos"
