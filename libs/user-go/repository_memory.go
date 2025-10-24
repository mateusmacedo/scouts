package gouser

import (
	"context"
	"strconv"
	"sync"
	"time"
)

// InMemoryUserRepository is a thread-safe in-memory implementation of UserRepository
type InMemoryUserRepository struct {
	users  map[string]*User
	nextID int
	mutex  sync.RWMutex
}

// NewInMemoryUserRepository creates a new In-memory user repository
func NewInMemoryUserRepository() *InMemoryUserRepository {
	return &InMemoryUserRepository{
		users:  make(map[string]*User),
		nextID: 1,
	}
}

// Create creates a new user
func (r *InMemoryUserRepository) Create(ctx context.Context, data CreateUserData) (*User, error) {
	// Validate input data
	if err := ValidateCreateUserData(data); err != nil {
		return nil, err
	}

	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Check for context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	user := &User{
		ID:        r.generateID(),
		Name:      data.Name,
		Email:     data.Email,
		Phone:     data.Phone,
		Address:   data.Address,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	r.users[user.ID] = user
	return user, nil
}

// FindByID finds a user by ID
func (r *InMemoryUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
	// Check for context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	r.mutex.RLock()
	defer r.mutex.RUnlock()

	user, exists := r.users[id]
	if !exists {
		return nil, nil
	}

	// Return a copy to prevent external modification
	userCopy := *user
	return &userCopy, nil
}

// FindAll finds all users
func (r *InMemoryUserRepository) FindAll(ctx context.Context) ([]*User, error) {
	// Check for context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	r.mutex.RLock()
	defer r.mutex.RUnlock()

	users := make([]*User, 0, len(r.users))
	for _, user := range r.users {
		// Return copies to prevent external modification
		userCopy := *user
		users = append(users, &userCopy)
	}

	return users, nil
}

// Update updates a user
func (r *InMemoryUserRepository) Update(ctx context.Context, id string, data UpdateUserData) (*User, error) {
	// Validate input data
	if err := ValidateUpdateUserData(data); err != nil {
		return nil, err
	}

	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Check for context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	user, exists := r.users[id]
	if !exists {
		return nil, nil
	}

	// Update only provided fields
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

	user.UpdatedAt = time.Now()

	// Return a copy
	userCopy := *user
	return &userCopy, nil
}

// Delete deletes a user
func (r *InMemoryUserRepository) Delete(ctx context.Context, id string) error {
	// Check for context cancellation
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	r.mutex.Lock()
	defer r.mutex.Unlock()

	_, exists := r.users[id]
	if !exists {
		return nil // User not found, but no error
	}

	delete(r.users, id)
	return nil
}

// generateID generates the next sequential ID
func (r *InMemoryUserRepository) generateID() string {
	id := r.nextID
	r.nextID++
	return strconv.Itoa(id) // Proper integer-to-string conversion
}

// Clear clears all users (useful for testing)
func (r *InMemoryUserRepository) Clear() {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	r.users = make(map[string]*User)
	r.nextID = 1
}
