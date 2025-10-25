#!/bin/bash

# Script para setup do Playwright em background
set -e

echo "🎭 Iniciando setup do Playwright em background..."

# Configurar variáveis de ambiente
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright

# Instalar dependências do Playwright
echo "📦 Instalando dependências do Playwright..."
pnpm install @playwright/test

# Instalar browsers (apenas se cache miss)
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo "🌐 Instalando browsers do Playwright..."
    npx playwright install chromium --with-deps
else
    echo "✅ Browsers do Playwright já estão em cache"
fi

echo "✅ Setup do Playwright concluído"
