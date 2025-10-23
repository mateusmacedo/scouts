# Arquitetura de Domínios e Dependências

Esta documentação descreve a classificação de escopos e os limites de dependência aplicados no workspace Nx. As regras são
validadas automaticamente pela regra `@nx/enforce-module-boundaries` configurada em `eslint.config.mjs`.

## Sistema de Tags

Cada projeto recebe duas categorias de tags:

- `type:*`: indica se o projeto é uma aplicação (`type:app`) ou biblioteca (`type:lib`).
- `scope:*`: identifica o domínio funcional ao qual o projeto pertence.

### Mapeamento de Escopos

| Scope            | Projetos                                                                 | Descrição                                                                 |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `scope:user-node` | `apps/bff-nest`, `libs/user-node`                                        | Domínio de usuários em Node/NestJS.                                       |
| `scope:user-go`   | `apps/user-go-service`, `libs/user-go`                                   | Domínio de usuários implementado em Go.                                   |
| `scope:logger`    | `libs/logger-node`, `libs/utils-nest`                                   | Stack de logging compartilhada entre aplicações.                          |
| `scope:tooling`   | `libs/biome-base`                                                       | Ferramentas de engenharia e configurações reutilizáveis.                  |

## Regras de Dependência

As seguintes restrições garantem baixo acoplamento entre domínios e evitam ciclos indevidos:

1. **Aplicações dependem apenas de bibliotecas**: qualquer projeto com `type:app` só pode importar projetos marcados com `type:lib`.
2. **Bibliotecas não dependem de aplicações**: projetos `type:lib` só podem depender de outras bibliotecas (`type:lib`).
3. **Domínio `scope:user-node`**: pode depender de bibliotecas do próprio domínio e da stack de logging (`scope:logger`).
4. **Domínio `scope:user-go`**: só pode depender de bibliotecas do mesmo domínio (`scope:user-go`).
5. **Domínio `scope:logger`**: limitado a dependências internas ao domínio (`scope:logger`).
6. **Domínio `scope:tooling`**: isolado; só depende de artefatos do próprio domínio (`scope:tooling`).

Qualquer violação dessas regras faz com que o lint (`pnpm nx lint --all`) falhe, garantindo que a arquitetura se mantenha
conforme definido.
