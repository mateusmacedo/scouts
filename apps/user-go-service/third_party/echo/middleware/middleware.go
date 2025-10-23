package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/labstack/echo/v4"
)

type CORSConfig struct {
	AllowOrigins []string
	AllowMethods []string
}

var requestIDCounter uint64

func RequestID() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			id := strconv.FormatUint(atomic.AddUint64(&requestIDCounter, 1), 10)
			c.Response().Header().Set("X-Request-ID", id)
			return next(c)
		}
	}
}

func Recover() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (err error) {
			defer func() {
				if r := recover(); r != nil {
					err = echo.NewHTTPError(http.StatusInternalServerError, "internal server error")
				}
			}()
			return next(c)
		}
	}
}

func Logger() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			err := next(c)
			_ = time.Since(start)
			return err
		}
	}
}

func CORS() echo.MiddlewareFunc {
	return CORSWithConfig(CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
	})
}

func CORSWithConfig(cfg CORSConfig) echo.MiddlewareFunc {
	allowOrigin := "*"
	if len(cfg.AllowOrigins) > 0 {
		allowOrigin = cfg.AllowOrigins[0]
	}

	allowMethods := cfg.AllowMethods
	if len(allowMethods) == 0 {
		allowMethods = []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions}
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			res := c.Response()
			res.Header().Set("Access-Control-Allow-Origin", allowOrigin)
			res.Header().Set("Access-Control-Allow-Methods", strings.Join(allowMethods, ","))
			res.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if c.Request().Method == http.MethodOptions {
				return c.NoContent(http.StatusNoContent)
			}

			return next(c)
		}
	}
}
