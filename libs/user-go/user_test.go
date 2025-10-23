package user

import (
	"testing"
	"time"
)

func TestNewUserNormalizesData(t *testing.T) {
	now := time.Date(2024, 8, 1, 10, 0, 0, 0, time.UTC)
	data := CreateUserData{
		Name:  "  Maria Silva  ",
		Email: "  MARIA@EXAMPLE.COM  ",
		Phone: "  +55 (11) 99999-0000  ",
	}

	user := NewUser("user-1", data, now)

	if user.ID != "user-1" {
		t.Fatalf("id inesperado: %s", user.ID)
	}

	if user.Name != "Maria Silva" {
		t.Fatalf("nome não normalizado: %q", user.Name)
	}

	if user.Email != "MARIA@EXAMPLE.COM" {
		t.Fatalf("email não normalizado: %q", user.Email)
	}

	if user.Phone != "+55 (11) 99999-0000" {
		t.Fatalf("telefone não normalizado: %q", user.Phone)
	}

	if !user.CreatedAt.Equal(now) {
		t.Fatalf("createdAt inesperado: %s", user.CreatedAt)
	}

	if !user.UpdatedAt.Equal(now) {
		t.Fatalf("updatedAt inesperado: %s", user.UpdatedAt)
	}
}

func TestApplyUpdateChangesFields(t *testing.T) {
	baseTime := time.Date(2024, 8, 1, 10, 0, 0, 0, time.UTC)
	user := NewUser("user-1", CreateUserData{Name: "Maria", Email: "maria@example.com", Phone: "11999990000"}, baseTime)

	updateTime := baseTime.Add(time.Hour)
	newName := "Maria Souza"
	newEmail := "maria.souza@example.com"
	newPhone := "+5511988880000"

	changed := user.ApplyUpdate(UpdateUserData{
		Name:  &newName,
		Email: &newEmail,
		Phone: &newPhone,
	}, updateTime)

	if !changed {
		t.Fatalf("esperava mudanças verdadeiras")
	}

	if user.Name != newName || user.Email != newEmail || user.Phone != newPhone {
		t.Fatalf("campos não atualizados corretamente")
	}

	if !user.UpdatedAt.Equal(updateTime) {
		t.Fatalf("updatedAt não ajustado")
	}
}

func TestApplyUpdateWithoutChanges(t *testing.T) {
	baseTime := time.Date(2024, 8, 1, 10, 0, 0, 0, time.UTC)
	user := NewUser("user-1", CreateUserData{Name: "Maria", Email: "maria@example.com", Phone: "11999990000"}, baseTime)

	sameName := user.Name
	changed := user.ApplyUpdate(UpdateUserData{Name: &sameName}, baseTime.Add(time.Minute))

	if changed {
		t.Fatalf("não deveria haver mudanças")
	}

	if !user.UpdatedAt.Equal(baseTime) {
		t.Fatalf("updatedAt não deveria mudar")
	}
}

func TestUpdateUserDataIsEmpty(t *testing.T) {
	var update UpdateUserData
	if !update.IsEmpty() {
		t.Fatalf("esperava IsEmpty verdadeiro")
	}

	value := "algo"
	update.Name = &value
	if update.IsEmpty() {
		t.Fatalf("esperava IsEmpty falso")
	}
}
