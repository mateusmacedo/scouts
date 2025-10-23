# @scouts/user-node

Biblioteca de domínio para gerenciamento de usuários em aplicações Node.js e TypeScript. O pacote serve como base comum para serviços HTTP, filas e aplicações CLI que precisam manipular entidades de usuário com regras de negócio consistentes.

> ℹ️ A versão atual ainda expõe `nodeUser()` como *stub* de publicação. Utilize este guia como referência para organizar os contratos definitivos antes de liberar novas versões.

## Requisitos mínimos

| Ferramenta          | Versão recomendada |
|---------------------|--------------------|
| Node.js             | ≥ 18.17            |
| pnpm                | ≥ 8.15             |
| TypeScript          | ≥ 5.4              |
| class-validator     | ≥ 0.14             |
| class-transformer   | ≥ 0.5              |

## Organização sugerida do código

```
libs/user-node/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── domain/               # Entidades e contratos
│       │   └── user.entity.ts
│       ├── dto/                  # DTOs e validadores
│       │   ├── create-user.dto.ts
│       │   ├── update-user.dto.ts
│       │   └── user-response.dto.ts
│       ├── services/
│       │   └── user.service.ts   # Casos de uso e orquestração
│       ├── repository/
│       │   └── user.repository.ts
│       └── events/
│           ├── user-events.ts
│           └── user-event-bus.ts
└── tests/                        # Cenários de integração e mocks
```

## Entidades de domínio

```typescript
export interface UserEntity {
  id: string;
  name: string;
  email: string;
  document?: string; // CPF/CNPJ normalizado
  phone?: string;
  status: 'active' | 'inactive' | 'blocked';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
```

- **Identificador**: string ULID/UUID padronizado pelo repositório.
- **Status**: controle para bloqueio lógico sem remoção física.
- **Metadados**: extensão flexível mantendo baixo acoplamento com canais externos.

## DTOs (Data Transfer Objects)

| DTO                  | Uso                                                     |
|----------------------|----------------------------------------------------------|
| `CreateUserDto`      | Entrada para criação. Campos obrigatórios: `name`, `email`. |
| `UpdateUserDto`      | Atualização parcial. Permite `name`, `email`, `status`, `metadata`. |
| `UserQueryDto`       | Consulta paginada (`page`, `limit`, `status`, `search`). |
| `UserResponseDto`    | Saída padronizada para APIs REST e filas. |

```typescript
import { IsEmail, IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  document?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'])
  status?: UserEntity['status'];

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UserQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @IsPositive()
  limit = 20;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'])
  status?: UserEntity['status'];

  @IsOptional()
  @IsString()
  search?: string;
}
```

## Repositório de usuários

```typescript
export interface UserRepository {
  create(data: CreateUserDto): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, data: UpdateUserDto): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  list(query: UserQueryDto): Promise<{ items: UserEntity[]; total: number }>;
}
```

- Implementações mínimas: in-memory (testes), Prisma/PostgreSQL (produção), DynamoDB (eventual).
- Métodos devem lançar erros específicos (`UserNotFoundError`, `DuplicatedEmailError`).

## Serviço de aplicação

```typescript
import { EventEmitter } from 'node:events';

export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly events: EventEmitter,
  ) {}

  async create(input: CreateUserDto): Promise<UserEntity> {
    await this.ensureEmailIsUnique(input.email);
    const entity = await this.repository.create(input);
    this.events.emit('user.created', entity);
    return entity;
  }

  async findById(id: string): Promise<UserEntity> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new UserNotFoundError(id);
    }
    return entity;
  }

  async update(id: string, input: UpdateUserDto): Promise<UserEntity> {
    if (input.email) {
      await this.ensureEmailIsUnique(input.email, id);
    }
    const entity = await this.repository.update(id, input);
    this.events.emit('user.updated', entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    this.events.emit('user.deleted', { id });
  }

  async list(query: UserQueryDto) {
    return this.repository.list(query);
  }

  private async ensureEmailIsUnique(email: string, ignoreId?: string) {
    const existing = await this.repository.findByEmail(email);
    if (existing && existing.id !== ignoreId) {
      throw new DuplicatedEmailError(email);
    }
  }
}
```

## Eventos de domínio

| Evento           | Payload                                    | Uso principal                              |
|------------------|--------------------------------------------|--------------------------------------------|
| `user.created`   | `UserEntity`                               | Sincronização com CRM, BI, notificações    |
| `user.updated`   | `UserEntity`                               | Reindexação, auditoria                     |
| `user.deleted`   | `{ id: string }`                           | Revogação de acessos, limpeza de caches    |

```typescript
const bus = new EventEmitter();

bus.on('user.created', (user: UserEntity) => {
  logger.info({ userId: user.id }, 'User created');
});

bus.on('user.deleted', ({ id }: { id: string }) => {
  logger.warn({ userId: id }, 'User deleted');
});
```

## Exemplo de uso completo (CRUD + eventos)

```typescript
import { EventEmitter } from 'node:events';
import { UserService } from './lib/services/user.service';
import { InMemoryUserRepository } from './tests/in-memory-user.repository';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './lib/dto';

const events = new EventEmitter();
const repository = new InMemoryUserRepository();
const service = new UserService(repository, events);

// Observadores de eventos
events.on('user.created', (user) => console.log('created', user));
events.on('user.updated', (user) => console.log('updated', user));
events.on('user.deleted', (payload) => console.log('deleted', payload));

(async () => {
  const created = await service.create(Object.assign(new CreateUserDto(), {
    name: 'João Silva',
    email: 'joao@example.com',
  }));

  await service.update(
    created.id,
    Object.assign(new UpdateUserDto(), { status: 'inactive' }),
  );

  const page = await service.list(Object.assign(new UserQueryDto(), { limit: 10 }));
  console.log('page', page.items.length, page.total);

  await service.delete(created.id);
})();
```

## Desenvolvimento

```bash
# Build
pnpm nx build user-node

# Testes unitários
pnpm nx test user-node

# Lint + formatação (Biome)
pnpm nx biome user-node
```

- Documente novos casos de uso em testes de integração (`tests/user.service.spec.ts`).
- Atualize mocks de repositório conforme forem adicionados métodos obrigatórios.

## Documentação relacionada

- [Arquitetura do domínio de usuários](../../docs/architecture/user-platform.md)
- ADRs e RFCs ainda não publicados — registre decisões relevantes na pasta `docs/architecture/`.

