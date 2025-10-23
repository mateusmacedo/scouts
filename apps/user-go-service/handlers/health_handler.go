package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
}

// ReadinessResponse represents the readiness check response
type ReadinessResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Checks    []Check   `json:"checks"`
}

// Check represents a health check
type Check struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
}

// HealthHandler handles health check endpoints
type HealthHandler struct {
	version string
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(version string) *HealthHandler {
	return &HealthHandler{
		version: version,
	}
}

// Health handles GET /health
func (h *HealthHandler) Health(c echo.Context) error {
	response := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now(),
		Version:   h.version,
	}

	return c.JSON(http.StatusOK, response)
}

// Ready handles GET /health/ready
func (h *HealthHandler) Ready(c echo.Context) error {
	checks := []Check{
		{
			Name:   "application",
			Status: "ok",
		},
		{
			Name:   "memory",
			Status: "ok",
		},
	}

	// Check if all checks are ok
	allOk := true
	for _, check := range checks {
		if check.Status != "ok" {
			allOk = false
			break
		}
	}

	status := "ok"
	httpStatus := http.StatusOK
	if !allOk {
		status = "error"
		httpStatus = http.StatusServiceUnavailable
	}

	response := ReadinessResponse{
		Status:    status,
		Timestamp: time.Now(),
		Checks:    checks,
	}

	return c.JSON(httpStatus, response)
}

// Live handles GET /health/live
func (h *HealthHandler) Live(c echo.Context) error {
	response := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now(),
		Version:   h.version,
	}

	return c.JSON(http.StatusOK, response)
}
