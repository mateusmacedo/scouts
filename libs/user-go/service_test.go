package gouser

import (
	"context"
	"testing"
)

// MockUserRepository is a mock implementation of UserRepository for testing
type MockUserRepository struct {
	users  map[string]*User
	nextID int
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users:  make(map[string]*User),
		nextID: 1,
	}
}

func (m *MockUserRepository) Create(ctx context.Context, data CreateUserData) (*User, error) {
	user := &User{
		ID:      string(rune(m.nextID + '0')),
		Name:    data.Name,
		Email:   data.Email,
		Phone:   data.Phone,
		Address: data.Address,
	}
	m.users[user.ID] = user
	m.nextID++
	return user, nil
}

func (m *MockUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
	user, exists := m.users[id]
	if !exists {
		return nil, nil
	}
	return user, nil
}

func (m *MockUserRepository) FindAll(ctx context.Context) ([]*User, error) {
	users := make([]*User, 0, len(m.users))
	for _, user := range m.users {
		users = append(users, user)
	}
	return users, nil
}

func (m *MockUserRepository) Update(ctx context.Context, id string, data UpdateUserData) (*User, error) {
	user, exists := m.users[id]
	if !exists {
		return nil, nil
	}

	if data.Name != nil {
		user.Name = *data.Name
	}
	if data.Email != nil {
		user.Email = *data.Email
	}
	if data.Phone != nil {
		user.Phone = *data.Phone
	}
	if data.Address != nil {
		user.Address = *data.Address
	}

	return user, nil
}

func (m *MockUserRepository) Delete(ctx context.Context, id string) error {
	delete(m.users, id)
	return nil
}

// MockUserEvents is a mock implementation of UserEvents for testing
type MockUserEvents struct {
	CreatedUsers []*User
	UpdatedUsers []*User
	DeletedIDs   []string
}

func NewMockUserEvents() *MockUserEvents {
	return &MockUserEvents{
		CreatedUsers: make([]*User, 0),
		UpdatedUsers: make([]*User, 0),
		DeletedIDs:   make([]string, 0),
	}
}

func (m *MockUserEvents) OnUserCreated(user *User) {
	m.CreatedUsers = append(m.CreatedUsers, user)
}

func (m *MockUserEvents) OnUserUpdated(user *User) {
	m.UpdatedUsers = append(m.UpdatedUsers, user)
}

func (m *MockUserEvents) OnUserDeleted(userID string) {
	m.DeletedIDs = append(m.DeletedIDs, userID)
}

func TestUserService_Create(t *testing.T) {
	repo := NewMockUserRepository()
	events := NewMockUserEvents()
	service := NewUserService(repo, events)
	ctx := context.Background()

	t.Run("should create user successfully", func(t *testing.T) {
		data := CreateUserData{
			Name:    "John Doe",
			Email:   "john@example.com",
			Phone:   "+1234567890",
			Address: "123 Main St",
		}

		user, err := service.Create(ctx, data)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if user == nil {
			t.Fatal("Expected user, got nil")
		}

		if user.Name != data.Name {
			t.Errorf("Expected name %s, got %s", data.Name, user.Name)
		}

		if user.Email != data.Email {
			t.Errorf("Expected email %s, got %s", data.Email, user.Email)
		}

		// Check events
		if len(events.CreatedUsers) != 1 {
			t.Errorf("Expected 1 created user event, got %d", len(events.CreatedUsers))
		}
	})

	t.Run("should validate email format", func(t *testing.T) {
		data := CreateUserData{
			Name:  "John Doe",
			Email: "invalid-email",
		}

		_, err := service.Create(ctx, data)

		if err != ErrInvalidEmail {
			t.Errorf("Expected ErrInvalidEmail, got %v", err)
		}
	})

	t.Run("should validate required fields", func(t *testing.T) {
		// Test empty name
		_, err := service.Create(ctx, CreateUserData{
			Name:  "",
			Email: "john@example.com",
		})

		if err != ErrEmptyName {
			t.Errorf("Expected ErrEmptyName, got %v", err)
		}

		// Test empty email
		_, err = service.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "",
		})

		if err != ErrEmptyEmail {
			t.Errorf("Expected ErrEmptyEmail, got %v", err)
		}
	})
}

func TestUserService_FindAll(t *testing.T) {
	repo := NewMockUserRepository()
	events := NewMockUserEvents()
	service := NewUserService(repo, events)
	ctx := context.Background()

	t.Run("should return all users", func(t *testing.T) {
		// Create some users directly in repository
		repo.Create(ctx, CreateUserData{
			Name:  "User 1",
			Email: "user1@example.com",
		})

		repo.Create(ctx, CreateUserData{
			Name:  "User 2",
			Email: "user2@example.com",
		})

		users, err := service.FindAll(ctx)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if len(users) != 2 {
			t.Errorf("Expected 2 users, got %d", len(users))
		}
	})
}

func TestUserService_FindByID(t *testing.T) {
	repo := NewMockUserRepository()
	events := NewMockUserEvents()
	service := NewUserService(repo, events)
	ctx := context.Background()

	t.Run("should return user when found", func(t *testing.T) {
		// Create user directly in repository
		createdUser, err := repo.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "john@example.com",
		})

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		user, err := service.FindByID(ctx, createdUser.ID)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if user == nil {
			t.Fatal("Expected user, got nil")
		}

		if user.ID != createdUser.ID {
			t.Errorf("Expected ID %s, got %s", createdUser.ID, user.ID)
		}
	})

	t.Run("should return error when user not found", func(t *testing.T) {
		_, err := service.FindByID(ctx, "nonexistent")

		if err != ErrUserNotFound {
			t.Errorf("Expected ErrUserNotFound, got %v", err)
		}
	})
}

func TestUserService_FindByEmail(t *testing.T) {
	repo := NewMockUserRepository()
	events := NewMockUserEvents()
	service := NewUserService(repo, events)
	ctx := context.Background()

	t.Run("should return user when found by email", func(t *testing.T) {
		// Create user directly in repository
		createdUser, err := repo.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "john@example.com",
		})

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		user, err := service.FindByEmail(ctx, "john@example.com")

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if user == nil {
			t.Fatal("Expected user, got nil")
		}

		if user.ID != createdUser.ID {
			t.Errorf("Expected ID %s, got %s", createdUser.ID, user.ID)
		}
	})

	t.Run("should return nil when user not found by email", func(t *testing.T) {
		user, err := service.FindByEmail(ctx, "nonexistent@example.com")

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if user != nil {
			t.Error("Expected nil user, got user")
		}
	})
}

func TestUserService_Update(t *testing.T) {
	repo := NewMockUserRepository()
	events := NewMockUserEvents()
	service := NewUserService(repo, events)
	ctx := context.Background()

	t.Run("should update user successfully", func(t *testing.T) {
		// Create user directly in repository
		createdUser, err := repo.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "john@example.com",
		})

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		newName := "John Smith"
		updateData := UpdateUserData{
			Name: &newName,
		}

		user, err := service.Update(ctx, createdUser.ID, updateData)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if user == nil {
			t.Fatal("Expected user, got nil")
		}

		if user.Name != newName {
			t.Errorf("Expected name %s, got %s", newName, user.Name)
		}

		// Check events
		if len(events.UpdatedUsers) != 1 {
			t.Errorf("Expected 1 updated user event, got %d", len(events.UpdatedUsers))
		}
	})

	t.Run("should return error when user not found", func(t *testing.T) {
		newName := "John Smith"
		updateData := UpdateUserData{
			Name: &newName,
		}

		_, err := service.Update(ctx, "nonexistent", updateData)

		if err != ErrUserNotFound {
			t.Errorf("Expected ErrUserNotFound, got %v", err)
		}
	})

	t.Run("should validate update data", func(t *testing.T) {
		// Create user directly in repository
		createdUser, err := repo.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "john@example.com",
		})

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		invalidEmail := "invalid-email"
		updateData := UpdateUserData{
			Email: &invalidEmail,
		}

		_, err = service.Update(ctx, createdUser.ID, updateData)

		if err != ErrInvalidEmail {
			t.Errorf("Expected ErrInvalidEmail, got %v", err)
		}
	})
}

func TestUserService_Delete(t *testing.T) {
	repo := NewMockUserRepository()
	events := NewMockUserEvents()
	service := NewUserService(repo, events)
	ctx := context.Background()

	t.Run("should delete user successfully", func(t *testing.T) {
		// Create user directly in repository
		createdUser, err := repo.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "john@example.com",
		})

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		err = service.Delete(ctx, createdUser.ID)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		// Check events
		if len(events.DeletedIDs) != 1 {
			t.Errorf("Expected 1 deleted user event, got %d", len(events.DeletedIDs))
		}

		if events.DeletedIDs[0] != createdUser.ID {
			t.Errorf("Expected deleted ID %s, got %s", createdUser.ID, events.DeletedIDs[0])
		}
	})

	t.Run("should return error when user not found", func(t *testing.T) {
		err := service.Delete(ctx, "nonexistent")

		if err != ErrUserNotFound {
			t.Errorf("Expected ErrUserNotFound, got %v", err)
		}
	})
}
