package gouser

import (
	"context"
	"fmt"
	"time"
)

// User represents a user entity
type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone,omitempty"`
	Address   string    `json:"address,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CreateUserData represents data needed to create a user
type CreateUserData struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone,omitempty"`
	Address string `json:"address,omitempty"`
}

// UpdateUserData represents data needed to update a user
type UpdateUserData struct {
	Name    *string `json:"name,omitempty"`
	Email   *string `json:"email,omitempty"`
	Phone   *string `json:"phone,omitempty"`
	Address *string `json:"address,omitempty"`
}

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(ctx context.Context, data CreateUserData) (*User, error)
	FindByID(ctx context.Context, id string) (*User, error)
	FindAll(ctx context.Context) ([]*User, error)
	Update(ctx context.Context, id string, data UpdateUserData) (*User, error)
	Delete(ctx context.Context, id string) error
}

// UserEvents defines the interface for user events
type UserEvents interface {
	OnUserCreated(user *User)
	OnUserUpdated(user *User)
	OnUserDeleted(userID string)
}

// UserService provides business logic for user operations
type UserService struct {
	repository UserRepository
	events     UserEvents
}

// NewUserService creates a new UserService instance
func NewUserService(repository UserRepository, events UserEvents) *UserService {
	return &UserService{
		repository: repository,
		events:     events,
	}
}

// Create creates a new user
func (s *UserService) Create(ctx context.Context, data CreateUserData) (*User, error) {
	// Validate input data
	if err := ValidateCreateUserData(data); err != nil {
		return nil, err
	}

	// Validate email uniqueness
	existingUser, err := s.FindByEmail(ctx, data.Email)
	if err != nil {
		// Se erro ao buscar, não podemos garantir unicidade - falhar rápido
		return nil, fmt.Errorf("failed to validate email uniqueness: %w", err)
	}
	if existingUser != nil {
		return nil, ErrUserAlreadyExists
	}

	user, err := s.repository.Create(ctx, data)
	if err != nil {
		return nil, err
	}

	if s.events != nil {
		s.events.OnUserCreated(user)
	}

	return user, nil
}

// FindAll retrieves all users
func (s *UserService) FindAll(ctx context.Context) ([]*User, error) {
	return s.repository.FindAll(ctx)
}

// FindByID retrieves a user by ID
func (s *UserService) FindByID(ctx context.Context, id string) (*User, error) {
	user, err := s.repository.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// FindByEmail retrieves a user by email
func (s *UserService) FindByEmail(ctx context.Context, email string) (*User, error) {
	users, err := s.repository.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	for _, user := range users {
		if user.Email == email {
			return user, nil
		}
	}

	return nil, nil // User not found, but no error
}

// Update updates a user
func (s *UserService) Update(ctx context.Context, id string, data UpdateUserData) (*User, error) {
	// Validate input data
	if err := ValidateUpdateUserData(data); err != nil {
		return nil, err
	}

	// Check if user exists
	existingUser, err := s.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// If email is being updated, check for conflicts
	if data.Email != nil && *data.Email != existingUser.Email {
		emailUser, err := s.FindByEmail(ctx, *data.Email)
		if err != nil {
			return nil, fmt.Errorf("failed to validate email uniqueness during update: %w", err)
		}
		if emailUser != nil {
			return nil, ErrUserAlreadyExists
		}
	}

	user, err := s.repository.Update(ctx, id, data)
	if err != nil {
		return nil, err
	}

	if s.events != nil {
		s.events.OnUserUpdated(user)
	}

	return user, nil
}

// Delete deletes a user
func (s *UserService) Delete(ctx context.Context, id string) error {
	// Check if user exists
	_, err := s.FindByID(ctx, id)
	if err != nil {
		return err
	}

	err = s.repository.Delete(ctx, id)
	if err != nil {
		return err
	}

	if s.events != nil {
		s.events.OnUserDeleted(id)
	}

	return nil
}
