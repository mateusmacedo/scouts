#!/usr/bin/env bash
set -e

echo "🔍 Validação de Primeira Release"
echo "================================="

ERRORS=0

# Verificar NPM registry
echo ""
echo "Verificando NPM registry..."
for pkg in logger-node utils-nest user-node; do
  if npm view "@scouts/$pkg" version 2>/dev/null; then
    VERSION=$(npm view "@scouts/$pkg" version)
    echo "❌ @scouts/$pkg JÁ EXISTE no NPM (v$VERSION)"
    echo "   Esta NÃO é a primeira release"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ @scouts/$pkg não existe (OK para primeira release)"
  fi
done

# Verificar tags remotas
echo ""
echo "Verificando tags remotas..."
REMOTE_TAGS=$(git ls-remote --tags origin | grep "@scouts/" | wc -l)
if [[ $REMOTE_TAGS -gt 0 ]]; then
  echo "⚠️  $REMOTE_TAGS tags @scouts/* encontradas remotamente:"
  git ls-remote --tags origin | grep "@scouts/"
  echo ""
  echo "Considere executar: ./scripts/cleanup-tags.sh"
else
  echo "✅ Nenhuma tag remota encontrada"
fi

# Verificar go.mod sync
echo ""
echo "Verificando sincronização Go..."
./scripts/sync-go-versions.sh || ERRORS=$((ERRORS + 1))

# Resultado
echo ""
echo "=========================================="
if [[ $ERRORS -eq 0 ]]; then
  echo "✅ Validação concluída com sucesso"
  echo "Pronto para primeira release!"
  exit 0
else
  echo "❌ $ERRORS erro(s) encontrado(s)"
  exit 1
fi
