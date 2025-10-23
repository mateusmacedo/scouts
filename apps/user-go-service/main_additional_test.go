package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	elog "github.com/labstack/gommon/log"
)

func TestApplyLogLevel(t *testing.T) {
	e := echo.New()

	applyLogLevel(e, "DEBUG")
	if e.Logger.Level() != elog.DEBUG {
		t.Fatalf("expected DEBUG level")
	}

	applyLogLevel(e, "WARN")
	if e.Logger.Level() != elog.WARN {
		t.Fatalf("expected WARN level")
	}

	applyLogLevel(e, "ERROR")
	if e.Logger.Level() != elog.ERROR {
		t.Fatalf("expected ERROR level")
	}

	applyLogLevel(e, "OFF")
	if e.Logger.Level() != elog.OFF {
		t.Fatalf("expected OFF level")
	}

	applyLogLevel(e, "TRACE")
	if e.Logger.Level() != elog.INFO {
		t.Fatalf("expected INFO fallback level")
	}
}

func TestCustomHTTPErrorHandler(t *testing.T) {
	e := echo.New()
	handler := customHTTPErrorHandler(e)

	ctx, rec := newStubContext("/error")
	handler(errors.New("boom"), ctx)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 got %d", rec.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("failed to decode payload: %v", err)
	}

	if payload["status"].(float64) != float64(http.StatusInternalServerError) {
		t.Fatalf("expected payload status 500 got %v", payload["status"])
	}

	ctxHTTP, recHTTP := newStubContext("/bad-request")
	handler(echo.NewHTTPError(http.StatusBadRequest, "bad"), ctxHTTP)
	if recHTTP.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 got %d", recHTTP.Code)
	}

	ctxCommitted, recCommitted := newStubContext("/committed")
	ctxCommitted.Response().WriteHeader(http.StatusOK)
	handler(errors.New("ignored"), ctxCommitted)
	if recCommitted.Code != http.StatusOK {
		t.Fatalf("expected code to remain 200 got %d", recCommitted.Code)
	}
}

type stubContext struct {
	req  *http.Request
	res  *echo.Response
	path string
}

func newStubContext(path string) (*stubContext, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, path, nil)
	rec := httptest.NewRecorder()
	res := &echo.Response{Writer: rec}
	return &stubContext{req: req, res: res, path: path}, rec
}

func (s *stubContext) Request() *http.Request { return s.req }

func (s *stubContext) Response() *echo.Response { return s.res }

func (s *stubContext) JSON(code int, v any) error {
	s.res.WriteHeader(code)
	return json.NewEncoder(s.res).Encode(v)
}

func (s *stubContext) NoContent(code int) error {
	s.res.WriteHeader(code)
	return nil
}

func (s *stubContext) Bind(any) error { return nil }

func (s *stubContext) Param(string) string { return "" }

func (s *stubContext) Path() string { return s.path }
