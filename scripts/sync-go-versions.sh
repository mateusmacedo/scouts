#!/usr/bin/env bash
set -e

# Script para sincronizar versão da lib user-go no user-go-service
# Uso: ./scripts/sync-go-versions.sh

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly GO_USER_PKG_JSON="${WORKSPACE_ROOT}/libs/user-go/package.json"
readonly GO_SERVICE_DIR="${WORKSPACE_ROOT}/apps/user-go-service"
readonly GO_MOD="${GO_SERVICE_DIR}/go.mod"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
log_success() { echo -e "${GREEN}✅ $*${NC}"; }
log_error() { echo -e "${RED}❌ $*${NC}" >&2; }
log_warning() { echo -e "${YELLOW}⚠️  $*${NC}"; }

# Validar que arquivos existem
if [[ ! -f "${GO_USER_PKG_JSON}" ]]; then
  log_error "package.json não encontrado: ${GO_USER_PKG_JSON}"
  exit 1
fi

if [[ ! -f "${GO_MOD}" ]]; then
  log_error "go.mod não encontrado: ${GO_MOD}"
  exit 1
fi

# Extrair versão do package.json
log_info "Extraindo versão de ${GO_USER_PKG_JSON}..."
cd "${WORKSPACE_ROOT}"
GO_USER_VERSION=$(node -p "require('./libs/user-go/package.json').version")

if [[ -z "${GO_USER_VERSION}" ]]; then
  log_error "Não foi possível extrair versão do package.json"
  exit 1
fi

log_info "Versão detectada: v${GO_USER_VERSION}"

# Atualizar go.mod
log_info "Atualizando ${GO_MOD}..."
cd "${GO_SERVICE_DIR}"

# Usar go get para atualizar (mais robusto que sed)
if go get "github.com/mateusmacedo/scouts/libs/user-go@v${GO_USER_VERSION}" 2>/dev/null; then
  log_success "Dependência atualizada via go get"
else
  log_info "go get falhou, tentando sed..."
  sed -i.bak "s|require github.com/mateusmacedo/scouts/libs/user-go v.*|require github.com/mateusmacedo/scouts/libs/user-go v${GO_USER_VERSION}|g" go.mod
  rm -f go.mod.bak
fi

# Validar com go mod tidy
log_info "Executando go mod tidy..."
if ! go mod tidy; then
  log_error "go mod tidy falhou"
  exit 1
fi

# Verificar se a versão foi aplicada
if grep -q "github.com/mateusmacedo/scouts/libs/user-go v${GO_USER_VERSION}" go.mod; then
  log_success "Sincronização concluída: v${GO_USER_VERSION}"
  exit 0
else
  log_error "Versão não foi atualizada corretamente no go.mod"
  exit 1
fi