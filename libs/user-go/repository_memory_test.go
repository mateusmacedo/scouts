package gouser

import (
	"context"
	"testing"
)

func TestInMemoryUserRepository_Create(t *testing.T) {
	repo := NewInMemoryUserRepository()
	ctx := context.Background()

	t.Run("should create user successfully", func(t *testing.T) {
		data := CreateUserData{
			Name:    "John Doe",
			Email:   "john@example.com",
			Phone:   "+1234567890",
			Address: "123 Main St",
		}

		user, err := repo.Create(ctx, data)

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

		if user.ID == "" {
			t.Error("Expected non-empty ID")
		}

		if user.CreatedAt.IsZero() {
			t.Error("Expected non-zero CreatedAt")
		}

		if user.UpdatedAt.IsZero() {
			t.Error("Expected non-zero UpdatedAt")
		}
	})

	t.Run("should assign sequential IDs", func(t *testing.T) {
		repo.Clear()

		user1, err1 := repo.Create(ctx, CreateUserData{
			Name:  "User 1",
			Email: "user1@example.com",
		})

		user2, err2 := repo.Create(ctx, CreateUserData{
			Name:  "User 2",
			Email: "user2@example.com",
		})

		if err1 != nil || err2 != nil {
			t.Fatalf("Expected no errors, got %v, %v", err1, err2)
		}

		if user1.ID == user2.ID {
			t.Error("Expected different IDs for different users")
		}
	})

	t.Run("should validate email format", func(t *testing.T) {
		data := CreateUserData{
			Name:  "John Doe",
			Email: "invalid-email",
		}

		_, err := repo.Create(ctx, data)

		if err != ErrInvalidEmail {
			t.Errorf("Expected ErrInvalidEmail, got %v", err)
		}
	})

	t.Run("should validate phone format", func(t *testing.T) {
		data := CreateUserData{
			Name:  "John Doe",
			Email: "john@example.com",
			Phone: "invalid-phone",
		}

		_, err := repo.Create(ctx, data)

		if err != ErrInvalidPhone {
			t.Errorf("Expected ErrInvalidPhone, got %v", err)
		}
	})

	t.Run("should validate required fields", func(t *testing.T) {
		// Test empty name
		_, err := repo.Create(ctx, CreateUserData{
			Name:  "",
			Email: "john@example.com",
		})

		if err != ErrEmptyName {
			t.Errorf("Expected ErrEmptyName, got %v", err)
		}

		// Test empty email
		_, err = repo.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "",
		})

		if err != ErrEmptyEmail {
			t.Errorf("Expected ErrEmptyEmail, got %v", err)
		}
	})
}

func TestInMemoryUserRepository_FindByID(t *testing.T) {
	repo := NewInMemoryUserRepository()
	ctx := context.Background()

	t.Run("should return user when found", func(t *testing.T) {
		createdUser, err := repo.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "john@example.com",
		})

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		user, err := repo.FindByID(ctx, createdUser.ID)

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

	t.Run("should return nil when user not found", func(t *testing.T) {
		user, err := repo.FindByID(ctx, "nonexistent")

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if user != nil {
			t.Error("Expected nil user, got user")
		}
	})
}

func TestInMemoryUserRepository_FindAll(t *testing.T) {
	repo := NewInMemoryUserRepository()
	ctx := context.Background()

	t.Run("should return empty slice when no users", func(t *testing.T) {
		users, err := repo.FindAll(ctx)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if len(users) != 0 {
			t.Errorf("Expected empty slice, got %d users", len(users))
		}
	})

	t.Run("should return all users", func(t *testing.T) {
		repo.Clear()

		user1, err1 := repo.Create(ctx, CreateUserData{
			Name:  "User 1",
			Email: "user1@example.com",
		})

		_, err2 := repo.Create(ctx, CreateUserData{
			Name:  "User 2",
			Email: "user2@example.com",
		})

		if err1 != nil || err2 != nil {
			t.Fatalf("Expected no errors, got %v, %v", err1, err2)
		}

		users, err := repo.FindAll(ctx)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if len(users) != 2 {
			t.Errorf("Expected 2 users, got %d", len(users))
		}

		// Check that we got copies, not references
		user1Copy := users[0]
		user1Copy.Name = "Modified"
		user1Original, _ := repo.FindByID(ctx, user1.ID)
		if user1Original.Name == "Modified" {
			t.Error("Expected original user to be unchanged")
		}
	})
}

func TestInMemoryUserRepository_Update(t *testing.T) {
	repo := NewInMemoryUserRepository()
	ctx := context.Background()

	t.Run("should update user successfully", func(t *testing.T) {
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

		updatedUser, err := repo.Update(ctx, createdUser.ID, updateData)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if updatedUser == nil {
			t.Fatal("Expected updated user, got nil")
		}

		if updatedUser.Name != newName {
			t.Errorf("Expected name %s, got %s", newName, updatedUser.Name)
		}

		if updatedUser.Email != createdUser.Email {
			t.Error("Expected email to remain unchanged")
		}

		if updatedUser.UpdatedAt.Before(createdUser.UpdatedAt) {
			t.Error("Expected UpdatedAt to be after original")
		}
	})

	t.Run("should return nil when user not found", func(t *testing.T) {
		newName := "John Smith"
		updateData := UpdateUserData{
			Name: &newName,
		}

		user, err := repo.Update(ctx, "nonexistent", updateData)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if user != nil {
			t.Error("Expected nil user, got user")
		}
	})

	t.Run("should validate update data", func(t *testing.T) {
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

		_, err = repo.Update(ctx, createdUser.ID, updateData)

		if err != ErrInvalidEmail {
			t.Errorf("Expected ErrInvalidEmail, got %v", err)
		}
	})
}

func TestInMemoryUserRepository_Delete(t *testing.T) {
	repo := NewInMemoryUserRepository()
	ctx := context.Background()

	t.Run("should delete user successfully", func(t *testing.T) {
		createdUser, err := repo.Create(ctx, CreateUserData{
			Name:  "John Doe",
			Email: "john@example.com",
		})

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		err = repo.Delete(ctx, createdUser.ID)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		// Verify user is deleted
		user, err := repo.FindByID(ctx, createdUser.ID)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if user != nil {
			t.Error("Expected user to be deleted")
		}
	})

	t.Run("should not error when deleting nonexistent user", func(t *testing.T) {
		err := repo.Delete(ctx, "nonexistent")

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
	})
}

func TestInMemoryUserRepository_Clear(t *testing.T) {
	repo := NewInMemoryUserRepository()
	ctx := context.Background()

	// Create some users
	_, err1 := repo.Create(ctx, CreateUserData{
		Name:  "User 1",
		Email: "user1@example.com",
	})

	_, err2 := repo.Create(ctx, CreateUserData{
		Name:  "User 2",
		Email: "user2@example.com",
	})

	if err1 != nil || err2 != nil {
		t.Fatalf("Expected no errors, got %v, %v", err1, err2)
	}

	// Clear repository
	repo.Clear()

	// Verify all users are gone
	users, err := repo.FindAll(ctx)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(users) != 0 {
		t.Errorf("Expected no users after clear, got %d", len(users))
	}

	// Verify next ID is reset
	user, err := repo.Create(ctx, CreateUserData{
		Name:  "New User",
		Email: "new@example.com",
	})

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Should start from ID 1 again
	if user.ID != "1" {
		t.Errorf("Expected ID 1, got %s", user.ID)
	}
}

func TestInMemoryUserRepository_Concurrency(t *testing.T) {
	repo := NewInMemoryUserRepository()
	ctx := context.Background()

	// Test concurrent access
	done := make(chan bool, 10)

	for i := 0; i < 10; i++ {
		go func(i int) {
			defer func() { done <- true }()

			_, err := repo.Create(ctx, CreateUserData{
				Name:  "User",
				Email: "user@example.com",
			})

			if err != nil {
				t.Errorf("Expected no error, got %v", err)
			}
		}(i)
	}

	// Wait for all goroutines to complete
	for i := 0; i < 10; i++ {
		<-done
	}

	// Verify all users were created
	users, err := repo.FindAll(ctx)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(users) != 10 {
		t.Errorf("Expected 10 users, got %d", len(users))
	}
}
