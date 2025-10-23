package main

import (
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/mateusmacedo/scouts/apps/user-go-service/handlers"
	gouser "github.com/mateusmacedo/scouts/libs/user-go"
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
