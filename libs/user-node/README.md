# @scouts/user-node

A comprehensive Node.js library for user management operations with full TypeScript support.

## Features

- **User CRUD Operations**: Create, read, update, and delete users
- **Data Validation**: Built-in validation using class-validator
- **TypeScript Support**: Full type safety and IntelliSense
- **Event System**: User lifecycle events for logging and monitoring
- **Repository Pattern**: Clean separation of concerns with repository interface
- **In-Memory Repository**: Thread-safe implementation for development and testing

## Installation

```bash
npm install @scouts/user-node
```

## Usage

### Basic Usage

```typescript
import { 
  UserService, 
  InMemoryUserRepository, 
  CreateUserDto, 
  UpdateUserDto,
  UserEvents 
} from '@scouts/user-node';

// Create repository and events handler
const repository = new InMemoryUserRepository();
const events: UserEvents = {
  onUserCreated: (user) => console.log('User created:', user.id),
  onUserUpdated: (user) => console.log('User updated:', user.id),
  onUserDeleted: (userId) => console.log('User deleted:', userId)
};

// Initialize service
const userService = new UserService(repository, events);

// Create a user
const createUserDto: CreateUserDto = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: '123 Main St'
};

const user = await userService.create(createUserDto);
console.log('Created user:', user);

// Find user by ID
const foundUser = await userService.findById(user.id);
console.log('Found user:', foundUser);

// Update user
const updateUserDto: UpdateUserDto = {
  name: 'John Smith',
  phone: '+0987654321'
};

const updatedUser = await userService.update(user.id, updateUserDto);
console.log('Updated user:', updatedUser);

// Get all users
const allUsers = await userService.findAll();
console.log('All users:', allUsers);

// Delete user
await userService.delete(user.id);
```

### With NestJS

```typescript
import { Injectable } from '@nestjs/common';
import { UserService, InMemoryUserRepository } from '@scouts/user-node';

@Injectable()
export class UsersService {
  private userService: UserService;

  constructor() {
    const repository = new InMemoryUserRepository();
    this.userService = new UserService(repository);
  }

  async createUser(data: CreateUserDto) {
    return this.userService.create(data);
  }

  async findUser(id: string) {
    return this.userService.findById(id);
  }
}
```

## API Reference

### Classes

#### `UserService`

Main service class for user operations.

**Constructor:**
- `new UserService(repository: UserRepository, events?: UserEvents)`

**Methods:**
- `create(data: CreateUserDto): Promise<User>` - Create a new user
- `findAll(): Promise<User[]>` - Get all users
- `findById(id: string): Promise<User>` - Find user by ID
- `findByEmail(email: string): Promise<User | null>` - Find user by email
- `update(id: string, data: UpdateUserDto): Promise<User>` - Update user
- `delete(id: string): Promise<void>` - Delete user

#### `InMemoryUserRepository`

In-memory implementation of UserRepository.

**Methods:**
- `create(data: CreateUserData): Promise<User>` - Create user
- `findById(id: string): Promise<User | null>` - Find by ID
- `findAll(): Promise<User[]>` - Get all users
- `update(id: string, data: UpdateUserData): Promise<User | null>` - Update user
- `delete(id: string): Promise<boolean>` - Delete user
- `clear(): void` - Clear all users (for testing)

### Interfaces

#### `User`

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `CreateUserDto`

```typescript
class CreateUserDto {
  name: string;        // Required, 2-100 characters
  email: string;       // Required, valid email format
  phone?: string;      // Optional, max 20 characters
  address?: string;    // Optional, max 500 characters
}
```

#### `UpdateUserDto`

```typescript
class UpdateUserDto {
  name?: string;       // Optional, 2-100 characters
  email?: string;      // Optional, valid email format
  phone?: string;     // Optional, max 20 characters
  address?: string;    // Optional, max 500 characters
}
```

#### `UserEvents`

```typescript
interface UserEvents {
  onUserCreated(user: User): void;
  onUserUpdated(user: User): void;
  onUserDeleted(userId: string): void;
}
```

## Error Handling

The library throws specific errors for different scenarios:

- `ConflictException` - When trying to create a user with an existing email
- `NotFoundException` - When trying to access a non-existent user
- Validation errors from class-validator for invalid input data

## Testing

```typescript
import { UserService, InMemoryUserRepository } from '@scouts/user-node';

describe('UserService', () => {
  let service: UserService;
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    service = new UserService(repository);
  });

  it('should create a user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const user = await service.create(userData);
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });
});
```

## Development

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

## Dependencies

- `@nestjs/common` - For dependency injection decorators
- `class-validator` - For data validation

## License

MIT