# Scripts de CI/CD

Este diretório contém scripts específicos que não duplicam funcionalidade nativa do Nx 20.
**IMPORTANTE:** Use funcionalidades nativas do Nx sempre que possível.

## 📁 Estrutura

```
scripts/
├── README.md                           # Este arquivo
├── fix-go-cache.sh                   # Correção de cache Go (específico)
├── sync-go-versions.sh               # Sincronização de versões Go (específico)
├── force-all-projects.sh             # Forçar todos os projetos (específico)
├── utils/                            # Scripts utilitários
│   ├── README.md                     # Documentação dos utilitários
│   └── common-functions.sh           # Funções comuns (adaptado para Nx 20)
├── security/                         # Scripts de segurança
│   └── validate-secrets.sh           # Validação de secrets (específico)
└── sonar/                            # Scripts do SonarCloud
    └── incremental-analysis.sh       # Análise incremental (específico)
```

## ⚠️ IMPORTANTE: Use Nx 20 nativo

**NÃO use scripts customizados para funcionalidades que o Nx 20 já fornece:**

- **Detecção de mudanças:** `nx affected --target=test --base=origin/main`
- **Cobertura:** `nx test --coverage` ou `nx affected --target=test --coverage`
- **Cache:** Nx gerencia automaticamente via `nx.json`
- **Retry:** Nx tem retry nativo via configuração
- **Paralelização:** `nx run-many --target=test --parallel=3`
- **Análise:** `nx graph`, `nx report`, `nx show projects`
- **Execução:** `nx exec` para scripts customizados
- **Configuração:** `nx.json` com `targetDefaults`, `namedInputs`

## 🚀 Scripts Específicos Mantidos

### Scripts Go (específicos)
- `fix-go-cache.sh` - Correção de cache Go
- `sync-go-versions.sh` - Sincronização de versões Go

### Scripts CI (específicos)
- `security/validate-secrets.sh` - Validação de secrets
- `sonar/incremental-analysis.sh` - Análise SonarCloud

### Scripts Utilitários (adaptados)
- `utils/common-functions.sh` - Funções comuns (sem duplicar Nx)

## 📝 Como Usar

### Para funcionalidades padrão, use Nx 20:
```bash
# Detecção de mudanças
nx affected --target=test --base=origin/main

# Cobertura
nx test --coverage

# Paralelização
nx run-many --target=test --parallel=3

# Análise
nx graph
nx report
```

### Para funcionalidades específicas, use scripts:
```bash
# Correção de cache Go
./scripts/fix-go-cache.sh

# Sincronização de versões Go
./scripts/sync-go-versions.sh

# Validação de secrets
./scripts/security/validate-secrets.sh
```
