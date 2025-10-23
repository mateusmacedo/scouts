package gouser

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sort"
	"strings"
	"sync"
	"time"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrInvalidUser  = errors.New("invalid user data")
)

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type CreateUserInput struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type UpdateUserInput struct {
	Name  *string `json:"name,omitempty"`
	Email *string `json:"email,omitempty"`
}

type UserService struct {
	mu    sync.RWMutex
	users map[string]User
}

func NewUserService() *UserService {
	return &UserService{users: make(map[string]User)}
}

func (s *UserService) CreateUser(ctx context.Context, input CreateUserInput) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}

	name := strings.TrimSpace(input.Name)
	email := strings.TrimSpace(input.Email)
	if name == "" || email == "" {
		return User{}, ErrInvalidUser
	}

	user := User{
		ID:        generateID(),
		Name:      name,
		Email:     email,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	s.mu.Lock()
	s.users[user.ID] = user
	s.mu.Unlock()

	return user, nil
}

func (s *UserService) GetUser(ctx context.Context, id string) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}

	s.mu.RLock()
	user, ok := s.users[id]
	s.mu.RUnlock()
	if !ok {
		return User{}, ErrUserNotFound
	}

	return user, nil
}

func (s *UserService) ListUsers(ctx context.Context) ([]User, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	users := make([]User, 0, len(s.users))
	for _, user := range s.users {
		users = append(users, user)
	}

	sort.Slice(users, func(i, j int) bool {
		return users[i].CreatedAt.Before(users[j].CreatedAt)
	})

	return users, nil
}

func (s *UserService) UpdateUser(ctx context.Context, id string, input UpdateUserInput) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	user, ok := s.users[id]
	if !ok {
		return User{}, ErrUserNotFound
	}

	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return User{}, ErrInvalidUser
		}
		user.Name = name
	}

	if input.Email != nil {
		email := strings.TrimSpace(*input.Email)
		if email == "" {
			return User{}, ErrInvalidUser
		}
		user.Email = email
	}

	user.UpdatedAt = time.Now().UTC()
	s.users[id] = user

	return user, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id string) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.users[id]; !ok {
		return ErrUserNotFound
	}

	delete(s.users, id)
	return nil
}

func generateID() string {
	const size = 16
	b := make([]byte, size)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().Format(time.RFC3339Nano)))
	}
	return hex.EncodeToString(b)
}
