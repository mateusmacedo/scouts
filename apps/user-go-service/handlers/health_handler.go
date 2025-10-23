package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

type HealthHandler struct {
	start time.Time
}

type healthResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Details   map[string]string `json:"details,omitempty"`
	Uptime    string            `json:"uptime,omitempty"`
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{start: time.Now().UTC()}
}

func (h *HealthHandler) Health(c echo.Context) error {
	return c.JSON(http.StatusOK, healthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC(),
		Uptime:    time.Since(h.start).String(),
		Details: map[string]string{
			"live":  "ok",
			"ready": "ok",
		},
	})
}

func (h *HealthHandler) Liveness(c echo.Context) error {
	return c.JSON(http.StatusOK, healthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC(),
	})
}

func (h *HealthHandler) Readiness(c echo.Context) error {
	return c.JSON(http.StatusOK, healthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC(),
	})
}
