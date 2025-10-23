package user

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestServiceCreateUser(t *testing.T) {
	repo := NewMemoryRepository()
	events := make(chan Event, 1)
	current := time.Date(2024, 8, 1, 12, 0, 0, 0, time.UTC)

	service := NewService(repo, events,
		WithIDGenerator(func() string { return "user-123" }),
		WithNowProvider(func() time.Time { return current }),
	)

	ctx := context.Background()
	user, err := service.CreateUser(ctx, CreateUserData{
		Name:  "  João da Silva  ",
		Email: "JOAO@example.com",
		Phone: "(11) 98888-0000",
	})
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if user.ID != "user-123" {
		t.Fatalf("id inesperado: %s", user.ID)
	}

	if user.Name != "João da Silva" {
		t.Fatalf("nome não normalizado: %q", user.Name)
	}

	if user.Email != "joao@example.com" {
		t.Fatalf("email não normalizado: %q", user.Email)
	}

	if user.Phone != "11988880000" {
		t.Fatalf("telefone não normalizado: %q", user.Phone)
	}

	select {
	case evt := <-events:
		if evt.Type != EventUserCreated {
			t.Fatalf("tipo de evento inesperado: %s", evt.Type)
		}
		if evt.User.ID != user.ID {
			t.Fatalf("evento com usuário incorreto")
		}
		if !evt.Timestamp.Equal(current) {
			t.Fatalf("timestamp de evento incorreto")
		}
	default:
		t.Fatalf("esperava evento publicado")
	}
}

func TestServiceCreateUserValidationErrors(t *testing.T) {
	repo := NewMemoryRepository()
	service := NewService(repo, nil)
	ctx := context.Background()

	if _, err := service.CreateUser(ctx, CreateUserData{Name: "Jo", Email: "test@example.com", Phone: "+5511999990000"}); !errors.Is(err, ErrInvalidName) {
		t.Fatalf("esperava erro de nome")
	}

	if _, err := service.CreateUser(ctx, CreateUserData{Name: "João", Email: "invalido", Phone: "+5511999990000"}); !errors.Is(err, ErrInvalidEmail) {
		t.Fatalf("esperava erro de email")
	}

	if _, err := service.CreateUser(ctx, CreateUserData{Name: "João", Email: "valid@example.com", Phone: "abc"}); !errors.Is(err, ErrInvalidPhone) {
		t.Fatalf("esperava erro de telefone")
	}
}

func TestServiceUpdateUser(t *testing.T) {
	repo := NewMemoryRepository()
	events := make(chan Event, 2)
	current := time.Date(2024, 8, 1, 15, 0, 0, 0, time.UTC)

	service := NewService(repo, events,
		WithIDGenerator(func() string { return "user-123" }),
		WithNowProvider(func() time.Time { return current }),
	)

	ctx := context.Background()
	created, err := service.CreateUser(ctx, CreateUserData{Name: "João", Email: "joao@example.com", Phone: "+5511999990000"})
	if err != nil {
		t.Fatalf("erro na criação inicial: %v", err)
	}

	<-events // consumir evento de criação

	current = current.Add(time.Hour)
	newName := "João Atualizado"
	newPhone := "(11) 97777-1234"
	updated, err := service.UpdateUser(ctx, created.ID, UpdateUserData{Name: &newName, Phone: &newPhone})
	if err != nil {
		t.Fatalf("erro na atualização: %v", err)
	}

	if updated.Name != "João Atualizado" {
		t.Fatalf("nome não atualizado")
	}

	if updated.Phone != "11977771234" {
		t.Fatalf("telefone não normalizado na atualização")
	}

	select {
	case evt := <-events:
		if evt.Type != EventUserUpdated {
			t.Fatalf("tipo de evento inesperado: %s", evt.Type)
		}
		if !evt.Timestamp.Equal(current) {
			t.Fatalf("timestamp incorreto")
		}
	default:
		t.Fatalf("esperava evento de atualização")
	}
}

func TestServiceUpdateUserErrors(t *testing.T) {
	repo := NewMemoryRepository()
	service := NewService(repo, nil)
	ctx := context.Background()

	if _, err := service.UpdateUser(ctx, "inexistente", UpdateUserData{Name: stringPtr("Nome")}); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("esperava ErrUserNotFound")
	}

	created, err := service.CreateUser(ctx, CreateUserData{Name: "João", Email: "joao@example.com", Phone: "+5511999990000"})
	if err != nil {
		t.Fatalf("erro na criação: %v", err)
	}

	if _, err := service.UpdateUser(ctx, created.ID, UpdateUserData{}); !errors.Is(err, ErrNoUpdateData) {
		t.Fatalf("esperava ErrNoUpdateData")
	}

	invalidPhone := "abc"
	if _, err := service.UpdateUser(ctx, created.ID, UpdateUserData{Phone: &invalidPhone}); !errors.Is(err, ErrInvalidPhone) {
		t.Fatalf("esperava ErrInvalidPhone")
	}
}

func TestServiceDeleteUser(t *testing.T) {
	repo := NewMemoryRepository()
	events := make(chan Event, 1)
	current := time.Date(2024, 8, 2, 10, 0, 0, 0, time.UTC)

	service := NewService(repo, events,
		WithIDGenerator(func() string { return "user-123" }),
		WithNowProvider(func() time.Time { return current }),
	)

	ctx := context.Background()
	created, err := service.CreateUser(ctx, CreateUserData{Name: "João", Email: "joao@example.com", Phone: "+5511999990000"})
	if err != nil {
		t.Fatalf("erro na criação: %v", err)
	}

	<-events

	current = current.Add(2 * time.Hour)
	if err := service.DeleteUser(ctx, created.ID); err != nil {
		t.Fatalf("erro ao remover: %v", err)
	}

	select {
	case evt := <-events:
		if evt.Type != EventUserDeleted {
			t.Fatalf("tipo de evento incorreto: %s", evt.Type)
		}
		if evt.User.ID != created.ID {
			t.Fatalf("usuario incorreto no evento")
		}
		if !evt.Timestamp.Equal(current) {
			t.Fatalf("timestamp incorreto")
		}
	default:
		t.Fatalf("esperava evento de exclusão")
	}

	if _, err := service.GetUser(ctx, created.ID); !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("esperava ErrUserNotFound após exclusão")
	}
}

func stringPtr(value string) *string {
	return &value
}
