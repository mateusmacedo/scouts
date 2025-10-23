# @scouts/user-go

A comprehensive Go library for user management operations with full concurrency support and context handling.

## Features

- **User CRUD Operations**: Create, read, update, and delete users
- **Data Validation**: Built-in validation with custom error types
- **Concurrency Support**: Thread-safe operations with sync.RWMutex
- **Context Support**: Full context.Context integration for cancellation
- **Event System**: User lifecycle events for logging and monitoring
- **Repository Pattern**: Clean separation of concerns with repository interface
- **In-Memory Repository**: Thread-safe implementation for development and testing

## Installation

```bash
go get github.com/mateusmacedo/scouts/libs/user-go
```

## Usage

### Basic Usage

```go
package main

import (
    "context"
    "fmt"
    "log"
    
    gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
    ctx := context.Background()
    
    // Create repository and events handler
    repository := gouser.NewInMemoryUserRepository()
    events := &UserEventsLogger{}
    userService := gouser.NewUserService(repository, events)
    
    // Create a user
    userData := gouser.CreateUserData{
        Name:    "John Doe",
        Email:   "john@example.com",
        Phone:   "+1234567890",
        Address: "123 Main St",
    }
    
    user, err := userService.Create(ctx, userData)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Created user: %+v\n", user)
    
    // Find user by ID
    foundUser, err := userService.FindByID(ctx, user.ID)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Found user: %+v\n", foundUser)
    
    // Update user
    newName := "John Smith"
    updateData := gouser.UpdateUserData{
        Name: &newName,
    }
    
    updatedUser, err := userService.Update(ctx, user.ID, updateData)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Updated user: %+v\n", updatedUser)
    
    // Get all users
    allUsers, err := userService.FindAll(ctx)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("All users: %+v\n", allUsers)
    
    // Delete user
    err = userService.Delete(ctx, user.ID)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Println("User deleted successfully")
}

// UserEventsLogger implements UserEvents interface for logging
type UserEventsLogger struct{}

func (l *UserEventsLogger) OnUserCreated(user *gouser.User) {
    log.Printf("User created: ID=%s, Name=%s, Email=%s", user.ID, user.Name, user.Email)
}

func (l *UserEventsLogger) OnUserUpdated(user *gouser.User) {
    log.Printf("User updated: ID=%s, Name=%s, Email=%s", user.ID, user.Name, user.Email)
}

func (l *UserEventsLogger) OnUserDeleted(userID string) {
    log.Printf("User deleted: ID=%s", userID)
}
```

### With HTTP Server (Echo)

```go
package main

import (
    "github.com/labstack/echo/v4"
    gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
    e := echo.New()
    
    // Initialize user service
    repository := gouser.NewInMemoryUserRepository()
    userService := gouser.NewUserService(repository, nil)
    
    // Setup routes
    e.POST("/users", createUserHandler(userService))
    e.GET("/users/:id", getUserHandler(userService))
    e.PUT("/users/:id", updateUserHandler(userService))
    e.DELETE("/users/:id", deleteUserHandler(userService))
    
    e.Logger.Fatal(e.Start(":8080"))
}
```

## API Reference

### Types

#### `User`

```go
type User struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    Phone     string    `json:"phone,omitempty"`
    Address   string    `json:"address,omitempty"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}
```

#### `CreateUserData`

```go
type CreateUserData struct {
    Name    string `json:"name"`
    Email   string `json:"email"`
    Phone   string `json:"phone,omitempty"`
    Address string `json:"address,omitempty"`
}
```

#### `UpdateUserData`

```go
type UpdateUserData struct {
    Name    *string `json:"name,omitempty"`
    Email   *string `json:"email,omitempty"`
    Phone   *string `json:"phone,omitempty"`
    Address *string `json:"address,omitempty"`
}
```

### Interfaces

#### `UserRepository`

```go
type UserRepository interface {
    Create(ctx context.Context, data CreateUserData) (*User, error)
    FindByID(ctx context.Context, id string) (*User, error)
    FindAll(ctx context.Context) ([]*User, error)
    Update(ctx context.Context, id string, data UpdateUserData) (*User, error)
    Delete(ctx context.Context, id string) error
}
```

#### `UserEvents`

```go
type UserEvents interface {
    OnUserCreated(user *User)
    OnUserUpdated(user *User)
    OnUserDeleted(userID string)
}
```

### Functions

#### `NewUserService(repository UserRepository, events UserEvents) *UserService`

Creates a new UserService instance.

#### `NewInMemoryUserRepository() *InMemoryUserRepository`

Creates a new in-memory repository instance.

### Methods

#### `UserService`

- `Create(ctx context.Context, data CreateUserData) (*User, error)` - Create a new user
- `FindAll(ctx context.Context) ([]*User, error)` - Get all users
- `FindByID(ctx context.Context, id string) (*User, error)` - Find user by ID
- `FindByEmail(ctx context.Context, email string) (*User, error)` - Find user by email
- `Update(ctx context.Context, id string, data UpdateUserData) (*User, error)` - Update user
- `Delete(ctx context.Context, id string) error` - Delete user

#### `InMemoryUserRepository`

- `Create(ctx context.Context, data CreateUserData) (*User, error)` - Create user
- `FindByID(ctx context.Context, id string) (*User, error)` - Find by ID
- `FindAll(ctx context.Context) ([]*User, error)` - Get all users
- `Update(ctx context.Context, id string, data UpdateUserData) (*User, error)` - Update user
- `Delete(ctx context.Context, id string) error` - Delete user
- `Clear()` - Clear all users (for testing)

## Error Handling

The library defines custom errors for different scenarios:

```go
var (
    ErrUserNotFound      = errors.New("user not found")
    ErrUserAlreadyExists = errors.New("user already exists")
    ErrInvalidEmail      = errors.New("invalid email format")
    ErrInvalidPhone      = errors.New("invalid phone format")
    ErrEmptyName         = errors.New("name cannot be empty")
    ErrEmptyEmail        = errors.New("email cannot be empty")
)
```

## Validation

The library includes built-in validation functions:

```go
// ValidateCreateUserData validates CreateUserData
func ValidateCreateUserData(data CreateUserData) error

// ValidateUpdateUserData validates UpdateUserData
func ValidateUpdateUserData(data UpdateUserData) error
```

## Testing

```go
package gouser

import (
    "context"
    "testing"
)

func TestUserService_Create(t *testing.T) {
    repository := NewInMemoryUserRepository()
    service := NewUserService(repository, nil)
    ctx := context.Background()
    
    data := CreateUserData{
        Name:  "John Doe",
        Email: "john@example.com",
    }
    
    user, err := service.Create(ctx, data)
    if err != nil {
        t.Fatalf("Expected no error, got %v", err)
    }
    
    if user.Name != data.Name {
        t.Errorf("Expected name %s, got %s", data.Name, user.Name)
    }
}
```

## Development

### Build

```bash
# Build da biblioteca
pnpm nx build user-go

# Build com watch mode
pnpm nx build user-go --watch
```

### Testes

```bash
# Executar testes
pnpm nx test user-go

# Testes com coverage
pnpm nx test user-go --coverage

# Testes em watch mode
pnpm nx test user-go --watch
```

### Lint e Formatação

```bash
# Lint
pnpm nx lint user-go

# Formatação
pnpm nx format user-go

# Biome (linting + formatação)
pnpm nx biome user-go
```

## Concurrency

The library is designed for concurrent use:

- All repository operations are thread-safe using `sync.RWMutex`
- Context cancellation is supported throughout
- No shared mutable state between operations

## Performance

### Benchmarks

```go
func BenchmarkUserService_Create(b *testing.B) {
    repository := NewInMemoryUserRepository()
    service := NewUserService(repository, nil)
    ctx := context.Background()
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        data := CreateUserData{
            Name:  "User",
            Email: fmt.Sprintf("user%d@example.com", i),
        }
        service.Create(ctx, data)
    }
}
```

## License

MIT