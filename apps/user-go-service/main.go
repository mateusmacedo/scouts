package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/mateusmacedo/scouts/apps/user-go-service/config"
	"github.com/mateusmacedo/scouts/apps/user-go-service/handlers"
	gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

const version = "1.0.0"

// CustomValidator is a custom validator for Echo
type CustomValidator struct{}

func (cv *CustomValidator) Validate(i interface{}) error {
	// For now, we'll use a simple validation approach
	// In a real application, you might want to use a more sophisticated validator
	return nil
}

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true

	// Configure validator
	e.Validator = &CustomValidator{}

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: cfg.CORSOrigins,
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// Request ID middleware
	e.Use(middleware.RequestID())

	// Timeout middleware
	e.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{
		Timeout: 30 * time.Second,
	}))

	// Initialize user service
	userRepository := gouser.NewInMemoryUserRepository()
	userEvents := &UserEventsLogger{}
	userService := gouser.NewUserService(userRepository, userEvents)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(version)
	userHandler := handlers.NewUserHandler(userService)

	// Routes
	setupRoutes(e, healthHandler, userHandler)

	// Start server
	startServer(e, cfg.Port)
}

// UserEventsLogger implements UserEvents interface for logging
type UserEventsLogger struct{}

func (l *UserEventsLogger) OnUserCreated(user *gouser.User) {
	log.Printf("User created: ID=%s, Name=%s, Email=%s", user.ID, user.Name, user.Email)
}

func (l *UserEventsLogger) OnUserUpdated(user *gouser.User) {
	log.Printf("User updated: ID=%s, Name=%s, Email=%s", user.ID, user.Name, user.Email)
}

func (l *UserEventsLogger) OnUserDeleted(userID string) {
	log.Printf("User deleted: ID=%s", userID)
}

// setupRoutes configures all routes
func setupRoutes(e *echo.Echo, healthHandler *handlers.HealthHandler, userHandler *handlers.UserHandler) {
	// Health check routes
	e.GET("/health", healthHandler.Health)
	e.GET("/health/ready", healthHandler.Ready)
	e.GET("/health/live", healthHandler.Live)

	// API routes
	api := e.Group("/api/v1")
	{
		users := api.Group("/users")
		{
			users.POST("", userHandler.Create)
			users.GET("", userHandler.GetAll)
			users.GET("/:id", userHandler.GetByID)
			users.PUT("/:id", userHandler.Update)
			users.DELETE("/:id", userHandler.Delete)
		}
	}

	// Root route
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"service": "user-go-service",
			"version": version,
			"status":  "running",
		})
	})
}

// startServer starts the HTTP server with graceful shutdown
func startServer(e *echo.Echo, port string) {
	// Start server in a goroutine
	go func() {
		if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Server started on port %s", port)

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
