package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/mateusmacedo/scouts/apps/user-go-service/handlers"
	gouser "github.com/mateusmacedo/scouts/libs/user-go"
	"github.com/stretchr/testify/assert"
)

func TestUserGoServiceIntegration(t *testing.T) {
	e := echo.New()
	e.HideBanner = true

	// Initialize services
	userRepository := gouser.NewInMemoryUserRepository()
	userEvents := &TestUserEventsLogger{}
	userService := gouser.NewUserService(userRepository, userEvents)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler("1.0.0")
	userHandler := handlers.NewUserHandler(userService)

	// Setup routes
	setupRoutes(e, healthHandler, userHandler)

	t.Run("Health Check", func(t *testing.T) {
		// This test just verifies the setup works
		if e == nil {
			t.Error("Echo instance should not be nil")
		}
		if userService == nil {
			t.Error("UserService should not be nil")
		}
		if userHandler == nil {
			t.Error("UserHandler should not be nil")
		}
		if healthHandler == nil {
			t.Error("HealthHandler should not be nil")
		}
	})
}

func TestUserCRUDFlow(t *testing.T) {
	e := echo.New()
	e.HideBanner = true

	// Configure validator
	e.Validator = &CustomValidator{}

	// Initialize services
	userRepository := gouser.NewInMemoryUserRepository()
	userEvents := &TestUserEventsLogger{}
	userService := gouser.NewUserService(userRepository, userEvents)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler("1.0.0")
	userHandler := handlers.NewUserHandler(userService)

	// Setup routes
	setupRoutes(e, healthHandler, userHandler)

	// Test: Create user
	t.Run("Create User", func(t *testing.T) {
		userData := gouser.CreateUserData{
			Name:    "John Doe",
			Email:   "john@example.com",
			Phone:   "123456789",
			Address: "123 Main St",
		}

		jsonData, _ := json.Marshal(userData)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Logf("Response body: %s", rec.Body.String())
		}
		assert.Equal(t, http.StatusCreated, rec.Code)

		var response map[string]interface{}
		err := json.Unmarshal(rec.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "John Doe", response["name"])
		assert.Equal(t, "john@example.com", response["email"])
		assert.NotEmpty(t, response["id"])
	})

	// Test: Get all users
	t.Run("Get All Users", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/users", nil)
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)

		var response []map[string]interface{}
		err := json.Unmarshal(rec.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Len(t, response, 1)
		assert.Equal(t, "John Doe", response[0]["name"])
	})

	// Test: Get user by ID
	t.Run("Get User By ID", func(t *testing.T) {
		// First create a user to get its ID
		userData := gouser.CreateUserData{
			Name:  "Jane Doe",
			Email: "jane@example.com",
		}

		jsonData, _ := json.Marshal(userData)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusCreated, rec.Code)

		var createResponse map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &createResponse)
		userID := createResponse["id"].(string)

		// Now get the user by ID
		req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/users/%s", userID), nil)
		rec = httptest.NewRecorder()

		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)

		var response map[string]interface{}
		err := json.Unmarshal(rec.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Jane Doe", response["name"])
		assert.Equal(t, "jane@example.com", response["email"])
	})

	// Test: Update user
	t.Run("Update User", func(t *testing.T) {
		// First create a user
		userData := gouser.CreateUserData{
			Name:  "Original Name",
			Email: "original@example.com",
		}

		jsonData, _ := json.Marshal(userData)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusCreated, rec.Code)

		var createResponse map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &createResponse)
		userID := createResponse["id"].(string)

		// Now update the user
		name := "Updated Name"
		phone := "987654321"
		updateData := gouser.UpdateUserData{
			Name:  &name,
			Phone: &phone,
		}

		jsonData, _ = json.Marshal(updateData)
		req = httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/users/%s", userID), bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		rec = httptest.NewRecorder()

		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)

		var response map[string]interface{}
		err := json.Unmarshal(rec.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", response["name"])
		assert.Equal(t, "987654321", response["phone"])
	})

	// Test: Delete user
	t.Run("Delete User", func(t *testing.T) {
		// First create a user
		userData := gouser.CreateUserData{
			Name:  "To Delete",
			Email: "delete@example.com",
		}

		jsonData, _ := json.Marshal(userData)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusCreated, rec.Code)

		var createResponse map[string]interface{}
		json.Unmarshal(rec.Body.Bytes(), &createResponse)
		userID := createResponse["id"].(string)

		// Now delete the user
		req = httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v1/users/%s", userID), nil)
		rec = httptest.NewRecorder()

		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusNoContent, rec.Code)

		// Verify user is deleted
		req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/users/%s", userID), nil)
		rec = httptest.NewRecorder()

		e.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})

	// Test: Error cases
	t.Run("Error Cases", func(t *testing.T) {
		// Test: Get non-existent user
		req := httptest.NewRequest(http.MethodGet, "/api/v1/users/999", nil)
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)

		// Test: Update non-existent user
		name := "Updated"
		updateData := gouser.UpdateUserData{Name: &name}
		jsonData, _ := json.Marshal(updateData)
		req = httptest.NewRequest(http.MethodPut, "/api/v1/users/999", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		rec = httptest.NewRecorder()

		e.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)

		// Test: Delete non-existent user
		req = httptest.NewRequest(http.MethodDelete, "/api/v1/users/999", nil)
		rec = httptest.NewRecorder()

		e.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHealthChecks(t *testing.T) {
	e := echo.New()
	e.HideBanner = true

	// Initialize services
	userRepository := gouser.NewInMemoryUserRepository()
	userEvents := &TestUserEventsLogger{}
	userService := gouser.NewUserService(userRepository, userEvents)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler("1.0.0")
	userHandler := handlers.NewUserHandler(userService)

	// Setup routes
	setupRoutes(e, healthHandler, userHandler)

	// Test: Health endpoint
	t.Run("Health Endpoint", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)

		var response map[string]interface{}
		err := json.Unmarshal(rec.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "ok", response["status"])
		assert.Equal(t, "1.0.0", response["version"])
	})

	// Test: Ready endpoint
	t.Run("Ready Endpoint", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)

		var response map[string]interface{}
		err := json.Unmarshal(rec.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "ok", response["status"])
	})

	// Test: Live endpoint
	t.Run("Live Endpoint", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
		rec := httptest.NewRecorder()

		e.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)

		var response map[string]interface{}
		err := json.Unmarshal(rec.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "ok", response["status"])
	})
}

// TestUserEventsLogger is a test implementation of UserEvents
type TestUserEventsLogger struct{}

func (l *TestUserEventsLogger) OnUserCreated(user *gouser.User) {
	// Test implementation - do nothing
}

func (l *TestUserEventsLogger) OnUserUpdated(user *gouser.User) {
	// Test implementation - do nothing
}

func (l *TestUserEventsLogger) OnUserDeleted(userID string) {
	// Test implementation - do nothing
}
