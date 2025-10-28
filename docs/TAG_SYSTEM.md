# Sistema de Tags Multidimensionais

Este documento define o sistema de tags utilizado no template Nx para controle de dependências e arquitetura limpa.

## Dimensões de Tags

### 1. Type (Tipo de Projeto)

Define o tipo fundamental do projeto:

- `type:app` - Aplicações (frontend, backend, mobile)
- `type:lib` - Bibliotecas reutilizáveis
- `type:e2e` - Testes end-to-end

### 2. Scope (Escopo)

Define o contexto organizacional do projeto:

- `scope:internal` - Projetos internos da organização
- `scope:external` - Projetos externos/terceiros
- `scope:shared` - Projetos compartilhados entre múltiplos contextos
- `scope:notifier` - Projetos específicos de notificação

### 3. Runtime (Ambiente de Execução)

Define onde o código é executado:

- `runtime:node` - Executa em Node.js
- `runtime:go` - Executa em Go
- `runtime:browser` - Executa no navegador
- `runtime:universal` - Executa em múltiplos ambientes

### 4. Layer (Camada Arquitetural)

Define a camada na arquitetura limpa:

- `layer:domain` - Lógica de domínio e entidades
- `layer:application` - Casos de uso e serviços de aplicação
- `layer:infrastructure` - Implementações técnicas (DB, APIs, etc.)
- `layer:presentation` - Interface do usuário e controllers

### 5. Visibility (Visibilidade)

Define a visibilidade do projeto:

- `visibility:public` - Público, pode ser usado por qualquer projeto
- `visibility:private` - Privado, apenas para uso interno
- `visibility:internal` - Interno, apenas no mesmo escopo

### 6. Platform (Plataforma)

Define a plataforma específica (quando aplicável):

- `platform:express` - Aplicações Express.js
- `platform:nest` - Aplicações NestJS
- `platform:react` - Aplicações React
- `platform:angular` - Aplicações Angular

## Regras de Dependência

### Hierarquia de Camadas

```
presentation → application → domain ← infrastructure
```

- **Presentation** pode depender de **Application** e **Domain**
- **Application** pode depender de **Domain** e **Infrastructure**
- **Domain** não pode depender de outras camadas (regra de dependência invertida)
- **Infrastructure** pode depender de **Domain**

### Regras de Runtime

- Projetos **Node** não podem depender de projetos **Go**
- Projetos **Go** não podem depender de projetos **Node**
- Projetos **Browser** podem depender de projetos **Node** (build time)
- Projetos **Universal** podem ser usados por qualquer runtime

### Regras de Visibility

- **Public** pode ser usado por qualquer projeto
- **Private** apenas por projetos do mesmo escopo
- **Internal** apenas por projetos do mesmo escopo e tipo

## Exemplos de Tags por Projeto

### Aplicações Backend

```json
{
  "tags": [
    "type:app",
    "scope:internal", 
    "runtime:node",
    "layer:application",
    "visibility:private",
    "platform:nest"
  ]
}
```

### Bibliotecas de Domínio

```json
{
  "tags": [
    "type:lib",
    "scope:internal",
    "runtime:node", 
    "layer:domain",
    "visibility:public"
  ]
}
```

### Bibliotecas de Infraestrutura

```json
{
  "tags": [
    "type:lib",
    "scope:internal",
    "runtime:node",
    "layer:infrastructure", 
    "visibility:public"
  ]
}
```

### Aplicações Go

```json
{
  "tags": [
    "type:app",
    "scope:internal",
    "runtime:go",
    "layer:application",
    "visibility:private"
  ]
}
```

## Configuração no ESLint

As regras de dependência são aplicadas através do `@nx/enforce-module-boundaries`:

```javascript
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "allow": [],
      "depConstraints": [
        // Regras de Layer
        {
          "sourceTag": "layer:presentation",
          "onlyDependOnLibsWithTags": ["layer:application", "layer:domain", "type:lib"]
        },
        {
          "sourceTag": "layer:application", 
          "onlyDependOnLibsWithTags": ["layer:domain", "layer:infrastructure", "type:lib"]
        },
        {
          "sourceTag": "layer:domain",
          "onlyDependOnLibsWithTags": ["type:lib"]
        },
        {
          "sourceTag": "layer:infrastructure",
          "onlyDependOnLibsWithTags": ["layer:domain", "type:lib"]
        },
        
        // Regras de Runtime
        {
          "sourceTag": "runtime:node",
          "onlyDependOnLibsWithTags": ["runtime:node", "runtime:universal"]
        },
        {
          "sourceTag": "runtime:go", 
          "onlyDependOnLibsWithTags": ["runtime:go", "runtime:universal"]
        },
        {
          "sourceTag": "runtime:browser",
          "onlyDependOnLibsWithTags": ["runtime:browser", "runtime:node", "runtime:universal"]
        },
        
        // Regras de Visibility
        {
          "sourceTag": "visibility:private",
          "onlyDependOnLibsWithTags": ["visibility:public", "visibility:private", "visibility:internal"]
        },
        {
          "sourceTag": "visibility:internal",
          "onlyDependOnLibsWithTags": ["visibility:public", "visibility:internal"]
        },
        {
          "sourceTag": "visibility:public",
          "onlyDependOnLibsWithTags": ["visibility:public"]
        }
      ]
    }
  ]
}
```

## Migração de Tags Existentes

### Aplicando Tags a Novos Projetos

Ao criar novos projetos, aplique as tags apropriadas baseadas na análise do projeto:

1. **Identifique o tipo**: `app` ou `lib`
2. **Defina o escopo**: `internal`, `external`, `shared`
3. **Determine o runtime**: `node`, `go`, `browser`, `universal`
4. **Classifique a camada**: `domain`, `application`, `infrastructure`, `presentation`
5. **Estabeleça visibilidade**: `public`, `private`, `internal`
6. **Especifique plataforma**: `nest`, `express`, `react`, `angular` (quando aplicável)

## Validação

Para validar se as tags estão corretas:

```bash
# Verificar se não há violações de boundaries
nx run-many -t lint

# Verificar dependências de um projeto específico
nx graph --focus=<project-name>

# Verificar todas as dependências
nx graph --file=dependencies.json
```

## Boas Práticas

1. **Sempre use tags consistentes** - Mantenha o mesmo padrão em todos os projetos
2. **Documente exceções** - Se uma dependência for necessária mas violar as regras, documente o motivo
3. **Revise regularmente** - As regras podem precisar de ajustes conforme o projeto evolui
4. **Use tags descritivas** - Evite tags genéricas como "misc" ou "other"
5. **Valide antes de commitar** - Execute `nx lint` antes de fazer push

