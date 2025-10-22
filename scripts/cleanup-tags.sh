#!/usr/bin/env bash
set -e

echo "🧹 Script de Limpeza de Tags Git"
echo "=================================="

# Backup
mkdir -p tmp
git tag -l > tmp/tags-backup-$(date +%Y%m%d-%H%M%S).txt
echo "✅ Backup criado em tmp/"

# Listar tags
echo ""
echo "Tags locais:"
git tag -l

echo ""
echo "Tags remotas:"
git ls-remote --tags origin

echo ""
read -p "Deseja deletar TODAS as tags @scouts/*? (yes/NO): " confirm

if [[ "$confirm" != "yes" ]]; then
  echo "❌ Operação cancelada"
  exit 0
fi

# Deletar local
for tag in $(git tag -l "@scouts/*"); do
  echo "Deletando local: $tag"
  git tag -d "$tag"
done

# Deletar remote
for tag in $(git ls-remote --tags origin | grep "@scouts/" | awk '{print $2}' | sed 's|refs/tags/||'); do
  echo "Deletando remote: $tag"
  git push --delete origin "$tag"
done

echo "✅ Limpeza concluída"
