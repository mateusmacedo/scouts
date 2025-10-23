package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/mateusmacedo/scouts/apps/user-go-service/config"
	gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func TestUserFlowIntegration(t *testing.T) {
	cfg := config.Config{Port: ":0", LogLevel: "OFF"}
	e := newServer(cfg, gouser.NewUserService())

	// Create user
	createPayload := `{"name":"Jane Doe","email":"jane@example.com"}`
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/users", strings.NewReader(createPayload))
	createReq.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	createRec := httptest.NewRecorder()
	e.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("expected status %d got %d: %s", http.StatusCreated, createRec.Code, createRec.Body.String())
	}

	var created gouser.User
	if err := json.Unmarshal(createRec.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to parse create response: %v", err)
	}

	if created.ID == "" {
		t.Fatalf("expected generated ID")
	}

	// List users
	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/users", nil)
	listRec := httptest.NewRecorder()
	e.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("expected status %d got %d", http.StatusOK, listRec.Code)
	}

	var listed []gouser.User
	if err := json.Unmarshal(listRec.Body.Bytes(), &listed); err != nil {
		t.Fatalf("failed to parse list response: %v", err)
	}

	if len(listed) != 1 {
		t.Fatalf("expected 1 user got %d", len(listed))
	}

	// Get user
	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/users/"+created.ID, nil)
	getRec := httptest.NewRecorder()
	e.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("expected status %d got %d", http.StatusOK, getRec.Code)
	}

	var fetched gouser.User
	if err := json.Unmarshal(getRec.Body.Bytes(), &fetched); err != nil {
		t.Fatalf("failed to parse get response: %v", err)
	}

	if fetched.ID != created.ID {
		t.Fatalf("expected ID %s got %s", created.ID, fetched.ID)
	}

	// Update user
	updatePayload := `{"name":"Jane Smith"}`
	updateReq := httptest.NewRequest(http.MethodPut, "/api/v1/users/"+created.ID, strings.NewReader(updatePayload))
	updateReq.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	updateRec := httptest.NewRecorder()
	e.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected status %d got %d: %s", http.StatusOK, updateRec.Code, updateRec.Body.String())
	}

	var updated gouser.User
	if err := json.Unmarshal(updateRec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("failed to parse update response: %v", err)
	}

	if updated.Name != "Jane Smith" {
		t.Fatalf("expected updated name 'Jane Smith' got %q", updated.Name)
	}

	// Invalid update (empty name) triggers validation error
	invalidUpdatePayload := `{"name":""}`
	invalidUpdateReq := httptest.NewRequest(http.MethodPut, "/api/v1/users/"+created.ID, strings.NewReader(invalidUpdatePayload))
	invalidUpdateReq.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	invalidUpdateRec := httptest.NewRecorder()
	e.ServeHTTP(invalidUpdateRec, invalidUpdateReq)

	if invalidUpdateRec.Code != http.StatusBadRequest {
		t.Fatalf("expected bad request on invalid update, got %d", invalidUpdateRec.Code)
	}

	// Delete user
	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/v1/users/"+created.ID, nil)
	deleteRec := httptest.NewRecorder()
	e.ServeHTTP(deleteRec, deleteReq)

	if deleteRec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d got %d", http.StatusNoContent, deleteRec.Code)
	}

	// Ensure user no longer exists
	getAfterDeleteReq := httptest.NewRequest(http.MethodGet, "/api/v1/users/"+created.ID, nil)
	getAfterDeleteRec := httptest.NewRecorder()
	e.ServeHTTP(getAfterDeleteRec, getAfterDeleteReq)

	if getAfterDeleteRec.Code != http.StatusNotFound {
		t.Fatalf("expected not found after delete, got %d", getAfterDeleteRec.Code)
	}

	// Health endpoints
	for _, path := range []string{"/health", "/health/live", "/health/ready"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200 for %s got %d", path, rec.Code)
		}
	}
}

func TestInvalidCreateRequest(t *testing.T) {
	cfg := config.Config{Port: ":0", LogLevel: "OFF"}
	e := newServer(cfg, gouser.NewUserService())

	req := httptest.NewRequest(http.MethodPost, "/api/v1/users", strings.NewReader("{}"))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected bad request got %d", rec.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to parse error payload: %v", err)
	}

	if payload["error"] == nil {
		t.Fatalf("expected error message in response: %v", payload)
	}
}
