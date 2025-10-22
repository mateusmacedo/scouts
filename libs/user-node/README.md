# user-node

Biblioteca de usuários para Node.js com funcionalidades básicas de gerenciamento de usuários.

## Características

- **Simplicidade**: Interface limpa e direta para operações básicas de usuário
- **TypeScript**: Totalmente tipado com suporte completo ao TypeScript
- **Testável**: Cobertura de testes com Jest
- **Modular**: Arquitetura modular para fácil extensão

## Instalação

```bash
npm install @scouts/user-node
```

## Uso Básico

```typescript
import { nodeUser } from '@scouts/user-node';

// Função básica de usuário
const result = nodeUser();
console.log(result); // 'user-node'
```

## API Reference

### nodeUser()

Retorna uma string identificadora da biblioteca.

**Retorno:** `string` - String identificadora 'user-node'

**Exemplo:**
```typescript
import { nodeUser } from '@scouts/user-node';

const identifier = nodeUser();
console.log(identifier); // 'user-node'
```

## Arquitetura

A biblioteca `user-node` segue uma arquitetura modular simples:

```
libs/user-node/
├── src/
│   ├── index.ts          # Ponto de entrada principal
│   └── lib/
│       ├── user-node.ts  # Implementação da função
│       └── user-node.spec.ts # Testes unitários
├── package.json          # Configuração do pacote
└── project.json         # Configuração Nx
```

## Desenvolvimento

### Build

```bash
# Build da biblioteca
pnpm nx build user-node

# Build com watch mode
pnpm nx build user-node --watch
```

### Testes

```bash
# Executar testes
pnpm nx test user-node

# Testes com coverage
pnpm nx test user-node --coverage

# Testes em watch mode
pnpm nx test user-node --watch
```

### Lint e Formatação

```bash
# Lint
pnpm nx lint user-node

# Formatação
pnpm nx format user-node

# Biome (linting + formatação)
pnpm nx biome user-node
```

## Roadmap

### Funcionalidades Planejadas

- [ ] **User Entity**: Interface para representação de usuários
- [ ] **User Service**: Serviço para operações CRUD de usuários
- [ ] **User Validation**: Validação de dados de usuário
- [ ] **User Events**: Sistema de eventos para mudanças de usuário
- [ ] **User Repository**: Interface para persistência de usuários

### Exemplo de Uso Futuro

```typescript
// Funcionalidade planejada
import { User, UserService, CreateUserDto } from '@scouts/user-node';

const userService = new UserService();

// Criar usuário
const user = await userService.create({
  name: 'João Silva',
  email: 'joao@example.com'
});

// Buscar usuário
const foundUser = await userService.findById(user.id);

// Atualizar usuário
await userService.update(user.id, {
  name: 'João Santos'
});
```

## Integração com Outras Bibliotecas

### logger-node

```typescript
import { nodeUser } from '@scouts/user-node';
import { createLogger } from '@scouts/logger-node';

const logger = createLogger();
logger.info('User operation', { operation: nodeUser() });
```

### utils-nest

```typescript
import { nodeUser } from '@scouts/user-node';
import { LoggerModule } from '@scouts/utils-nest';

@Module({
  imports: [LoggerModule.forRoot()],
  providers: [
    {
      provide: 'USER_SERVICE',
      useValue: nodeUser
    }
  ]
})
export class UserModule {}
```

## Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

MIT - veja o arquivo [LICENSE](../../LICENSE) para detalhes.

