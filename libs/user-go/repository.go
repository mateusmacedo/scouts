package user

import (
	"context"
	"errors"
)

var (
	// ErrUserNotFound é retornado quando a entidade não existe no repositório.
	ErrUserNotFound = errors.New("user not found")
	// ErrUserAlreadyExists é retornado quando ocorre tentativa de criação com identificador duplicado.
	ErrUserAlreadyExists = errors.New("user already exists")
)

// UserRepository define as operações CRUD com suporte a contexto.
type UserRepository interface {
	Create(ctx context.Context, user User) (User, error)
	GetByID(ctx context.Context, id string) (User, error)
	Update(ctx context.Context, user User) (User, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]User, error)
}
