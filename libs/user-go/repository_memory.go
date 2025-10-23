package user

import (
	"context"
	"sync"
)

// MemoryRepository implementa UserRepository em memória com segurança para concorrência.
type MemoryRepository struct {
	mu    sync.RWMutex
	users map[string]User
}

// NewMemoryRepository cria uma nova instância do repositório em memória.
func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		users: make(map[string]User),
	}
}

func (r *MemoryRepository) Create(ctx context.Context, user User) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.users[user.ID]; exists {
		return User{}, ErrUserAlreadyExists
	}

	r.users[user.ID] = user.Clone()

	return user.Clone(), nil
}

func (r *MemoryRepository) GetByID(ctx context.Context, id string) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	user, ok := r.users[id]
	if !ok {
		return User{}, ErrUserNotFound
	}

	return user.Clone(), nil
}

func (r *MemoryRepository) Update(ctx context.Context, user User) (User, error) {
	if err := ctx.Err(); err != nil {
		return User{}, err
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.users[user.ID]; !ok {
		return User{}, ErrUserNotFound
	}

	r.users[user.ID] = user.Clone()
	return user.Clone(), nil
}

func (r *MemoryRepository) Delete(ctx context.Context, id string) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.users[id]; !ok {
		return ErrUserNotFound
	}

	delete(r.users, id)
	return nil
}

func (r *MemoryRepository) List(ctx context.Context) ([]User, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]User, 0, len(r.users))
	for _, user := range r.users {
		result = append(result, user.Clone())
	}

	return result, nil
}
