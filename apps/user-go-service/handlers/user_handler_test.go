package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func TestUserHandlerFlow(t *testing.T) {
	service := gouser.NewUserService()
	handler := NewUserHandler(service)
	e := echo.New()
	e.POST("/users", handler.CreateUser)
	e.GET("/users", handler.ListUsers)
	e.GET("/users/:id", handler.GetUser)
	e.PUT("/users/:id", handler.UpdateUser)
	e.DELETE("/users/:id", handler.DeleteUser)

	createReq := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(`{"name":"Alice","email":"alice@example.com"}`))
	createReq.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	createRec := httptest.NewRecorder()
	e.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("expected status %d got %d", http.StatusCreated, createRec.Code)
	}

	var created gouser.User
	if err := json.Unmarshal(createRec.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to decode create response: %v", err)
	}

	listRec := httptest.NewRecorder()
	e.ServeHTTP(listRec, httptest.NewRequest(http.MethodGet, "/users", nil))
	if listRec.Code != http.StatusOK {
		t.Fatalf("expected status 200 list got %d", listRec.Code)
	}

	getRec := httptest.NewRecorder()
	e.ServeHTTP(getRec, httptest.NewRequest(http.MethodGet, "/users/"+created.ID, nil))
	if getRec.Code != http.StatusOK {
		t.Fatalf("expected status 200 get got %d", getRec.Code)
	}

	updateReq := httptest.NewRequest(http.MethodPut, "/users/"+created.ID, strings.NewReader(`{"email":"alice@new.com"}`))
	updateReq.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	updateRec := httptest.NewRecorder()
	e.ServeHTTP(updateRec, updateReq)
	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected status 200 update got %d", updateRec.Code)
	}

	deleteRec := httptest.NewRecorder()
	e.ServeHTTP(deleteRec, httptest.NewRequest(http.MethodDelete, "/users/"+created.ID, nil))
	if deleteRec.Code != http.StatusNoContent {
		t.Fatalf("expected status 204 delete got %d", deleteRec.Code)
	}

	notFoundRec := httptest.NewRecorder()
	e.ServeHTTP(notFoundRec, httptest.NewRequest(http.MethodGet, "/users/"+created.ID, nil))
	if notFoundRec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete got %d", notFoundRec.Code)
	}
}

func TestHandleServiceError(t *testing.T) {
	tests := []struct {
		name     string
		input    error
		expected int
	}{
		{name: "invalid", input: gouser.ErrInvalidUser, expected: http.StatusBadRequest},
		{name: "notfound", input: gouser.ErrUserNotFound, expected: http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := handleServiceError(tt.input)
			httpErr, ok := err.(*echo.HTTPError)
			if !ok {
				t.Fatalf("expected HTTPError got %T", err)
			}
			if httpErr.Code != tt.expected {
				t.Fatalf("expected status %d got %d", tt.expected, httpErr.Code)
			}
		})
	}

	unknown := errors.New("generic")
	if err := handleServiceError(unknown); err != unknown {
		t.Fatalf("expected original error to be returned")
	}
}
