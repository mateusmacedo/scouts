package user

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"
)

func TestMemoryRepositoryCRUD(t *testing.T) {
	repo := NewMemoryRepository()
	ctx := context.Background()
	now := time.Date(2024, 8, 1, 10, 0, 0, 0, time.UTC)
	user := NewUser("user-1", CreateUserData{Name: "Ana", Email: "ana@example.com", Phone: "11999990000"}, now)

	created, err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("erro ao criar: %v", err)
	}

	if created.ID != user.ID {
		t.Fatalf("id inesperado")
	}

	fetched, err := repo.GetByID(ctx, user.ID)
	if err != nil {
		t.Fatalf("erro ao buscar: %v", err)
	}

	if fetched.Name != user.Name {
		t.Fatalf("nome inesperado")
	}

	users, err := repo.List(ctx)
	if err != nil {
		t.Fatalf("erro ao listar: %v", err)
	}

	if len(users) != 1 {
		t.Fatalf("esperava 1 usuário, obtive %d", len(users))
	}

	update := fetched.Clone()
	update.Name = "Ana Atualizada"
	update.UpdatedAt = now.Add(time.Hour)
	updated, err := repo.Update(ctx, update)
	if err != nil {
		t.Fatalf("erro ao atualizar: %v", err)
	}

	if updated.Name != "Ana Atualizada" {
		t.Fatalf("nome não atualizado")
	}

	if err := repo.Delete(ctx, user.ID); err != nil {
		t.Fatalf("erro ao remover: %v", err)
	}

	if _, err := repo.GetByID(ctx, user.ID); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("esperava ErrUserNotFound, obtive %v", err)
	}
}

func TestMemoryRepositoryConcurrency(t *testing.T) {
	repo := NewMemoryRepository()
	ctx := context.Background()

	wg := sync.WaitGroup{}
	for i := 0; i < 10; i++ {
		idx := i
		wg.Add(1)
		go func() {
			defer wg.Done()
			id := fmt.Sprintf("user-%d", idx)
			email := fmt.Sprintf("user%d@example.com", idx)
			phone := fmt.Sprintf("1199999%03d", idx)
			user := NewUser(id, CreateUserData{Name: "User", Email: email, Phone: phone}, time.Now())
			_, _ = repo.Create(ctx, user)
			_, _ = repo.GetByID(ctx, id)
		}()
	}

	wg.Wait()

	users, err := repo.List(ctx)
	if err != nil {
		t.Fatalf("erro ao listar: %v", err)
	}

	if len(users) == 0 {
		t.Fatalf("esperava usuários cadastrados")
	}
}

func TestMemoryRepositoryContextCancellation(t *testing.T) {
	repo := NewMemoryRepository()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := repo.Create(ctx, User{ID: "x"})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("esperava context.Canceled, obtive %v", err)
	}

	if err := repo.Delete(ctx, "x"); !errors.Is(err, context.Canceled) {
		t.Fatalf("esperava context.Canceled, obtive %v", err)
	}
}

func TestMemoryRepositoryErrors(t *testing.T) {
	repo := NewMemoryRepository()
	ctx := context.Background()

	user := NewUser("user-1", CreateUserData{Name: "Ana", Email: "ana@example.com", Phone: "11999990000"}, time.Now())
	if _, err := repo.Update(ctx, user); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("esperava ErrUserNotFound na atualização vazia")
	}

	if err := repo.Delete(ctx, user.ID); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("esperava ErrUserNotFound na exclusão vazia")
	}

	if _, err := repo.Create(ctx, user); err != nil {
		t.Fatalf("não esperava erro na criação inicial: %v", err)
	}

	if _, err := repo.Create(ctx, user); !errors.Is(err, ErrUserAlreadyExists) {
		t.Fatalf("esperava ErrUserAlreadyExists")
	}
}
