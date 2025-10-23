package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestHealthEndpoints(t *testing.T) {
	handler := NewHealthHandler()
	e := echo.New()
	e.GET("/health", handler.Health)
	e.GET("/health/live", handler.Liveness)
	e.GET("/health/ready", handler.Readiness)

	tests := []string{"/health", "/health/live", "/health/ready"}
	for _, path := range tests {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 for %s got %d", path, rec.Code)
		}

		var body map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("failed to parse response for %s: %v", path, err)
		}

		if body["status"] != "ok" {
			t.Fatalf("expected status ok for %s got %v", path, body["status"])
		}
	}
}
