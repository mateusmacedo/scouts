package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"

	"github.com/mateusmacedo/scouts/apps/user-go-service/config"
	"github.com/mateusmacedo/scouts/apps/user-go-service/handlers"
	gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
	cfg := config.Load()
	service := gouser.NewUserService()
	server := newServer(cfg, service)

	go func() {
		if err := server.Start(cfg.Port); err != nil && !errors.Is(err, http.ErrServerClosed) {
			server.Logger.Fatalf("failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		server.Logger.Fatalf("failed to shutdown server: %v", err)
	}
}

func newServer(cfg config.Config, service *gouser.UserService) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.HTTPErrorHandler = customHTTPErrorHandler(e)

	applyLogLevel(e, cfg.LogLevel)

	e.Use(middleware.RequestID())
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())

	if len(cfg.CORSOrigins) > 0 {
		e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
			AllowOrigins: cfg.CORSOrigins,
			AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		}))
	} else {
		e.Use(middleware.CORS())
	}

	healthHandler := handlers.NewHealthHandler()
	e.GET("/health", healthHandler.Health)
	e.GET("/health/live", healthHandler.Liveness)
	e.GET("/health/ready", healthHandler.Readiness)

	userHandler := handlers.NewUserHandler(service)
	users := e.Group("/api/v1/users")
	users.POST("", userHandler.CreateUser)
	users.GET("", userHandler.ListUsers)
	users.GET("/:id", userHandler.GetUser)
	users.PUT("/:id", userHandler.UpdateUser)
	users.DELETE("/:id", userHandler.DeleteUser)

	return e
}

func applyLogLevel(e *echo.Echo, level string) {
	switch level {
	case "DEBUG":
		e.Logger.SetLevel(log.DEBUG)
	case "WARN":
		e.Logger.SetLevel(log.WARN)
	case "ERROR":
		e.Logger.SetLevel(log.ERROR)
	case "OFF":
		e.Logger.SetLevel(log.OFF)
	default:
		e.Logger.SetLevel(log.INFO)
	}
}

func customHTTPErrorHandler(e *echo.Echo) echo.HTTPErrorHandler {
	return func(err error, c echo.Context) {
		if c.Response().Committed() {
			return
		}

		var he *echo.HTTPError
		if errors.As(err, &he) {
			_ = c.JSON(he.Code, map[string]any{
				"error":   he.Message,
				"status":  he.Code,
				"request": c.Path(),
			})
			return
		}

		e.Logger.Error(err)
		_ = c.JSON(http.StatusInternalServerError, map[string]any{
			"error":   http.StatusText(http.StatusInternalServerError),
			"status":  http.StatusInternalServerError,
			"request": c.Path(),
		})
	}
}
