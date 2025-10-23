package user

import (
	"strings"
	"time"
)

// User representa a entidade de domínio utilizada na biblioteca.
type User struct {
	ID        string
	Name      string
	Email     string
	Phone     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// CreateUserData encapsula os dados necessários para criar um usuário.
type CreateUserData struct {
	Name  string
	Email string
	Phone string
}

// UpdateUserData guarda valores opcionais para atualização de um usuário existente.
type UpdateUserData struct {
	Name  *string
	Email *string
	Phone *string
}

// IsEmpty informa se nenhuma alteração foi fornecida.
func (d UpdateUserData) IsEmpty() bool {
	return d.Name == nil && d.Email == nil && d.Phone == nil
}

// NewUser cria uma nova entidade `User` aplicando normalização básica.
func NewUser(id string, data CreateUserData, timestamp time.Time) User {
	normalizedName := strings.TrimSpace(data.Name)
	normalizedEmail := strings.TrimSpace(data.Email)
	normalizedPhone := strings.TrimSpace(data.Phone)
	normalizedTime := timestamp.UTC()

	return User{
		ID:        id,
		Name:      normalizedName,
		Email:     normalizedEmail,
		Phone:     normalizedPhone,
		CreatedAt: normalizedTime,
		UpdatedAt: normalizedTime,
	}
}

// Clone retorna uma cópia independente da entidade.
func (u User) Clone() User {
	return User{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Phone:     u.Phone,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// ApplyUpdate aplica campos alterados ao usuário atual. Retorna verdadeiro se houve modificação.
func (u *User) ApplyUpdate(data UpdateUserData, timestamp time.Time) bool {
	if u == nil {
		return false
	}

	changed := false

	if data.Name != nil {
		trimmed := strings.TrimSpace(*data.Name)
		if trimmed != u.Name {
			u.Name = trimmed
			changed = true
		}
	}

	if data.Email != nil {
		trimmed := strings.TrimSpace(*data.Email)
		if trimmed != u.Email {
			u.Email = trimmed
			changed = true
		}
	}

	if data.Phone != nil {
		trimmed := strings.TrimSpace(*data.Phone)
		if trimmed != u.Phone {
			u.Phone = trimmed
			changed = true
		}
	}

	if changed {
		u.UpdatedAt = timestamp.UTC()
	}

	return changed
}
