package echo

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"

	elog "github.com/labstack/gommon/log"
)

const (
	HeaderContentType   = "Content-Type"
	MIMEApplicationJSON = "application/json"
)

type HandlerFunc func(Context) error

type MiddlewareFunc func(HandlerFunc) HandlerFunc

type HTTPErrorHandler func(error, Context)

type Context interface {
	Request() *http.Request
	Response() *Response
	JSON(int, any) error
	NoContent(int) error
	Bind(any) error
	Param(string) string
	Path() string
}

type Echo struct {
	HideBanner       bool
	HidePort         bool
	HTTPErrorHandler HTTPErrorHandler
	Logger           *elog.Logger

	routes     []*route
	middleware []MiddlewareFunc
	mu         sync.Mutex
	httpServer *http.Server
}

type Group struct {
	prefix string
	e      *Echo
}

type route struct {
	method  string
	path    string
	handler HandlerFunc
}

type contextImpl struct {
	e        *Echo
	request  *http.Request
	response *Response
	path     string
	params   map[string]string
}

type Response struct {
	Writer    http.ResponseWriter
	status    int
	committed bool
}

type HTTPError struct {
	Code     int
	Message  any
	Internal error
}

func New() *Echo {
	e := &Echo{
		Logger:           elog.New("echo"),
		HTTPErrorHandler: defaultHTTPErrorHandler,
	}
	return e
}

func defaultHTTPErrorHandler(err error, c Context) {
	if he, ok := err.(*HTTPError); ok {
		_ = c.JSON(he.Code, map[string]any{"error": he.Message})
		return
	}
	_ = c.JSON(http.StatusInternalServerError, map[string]any{"error": http.StatusText(http.StatusInternalServerError)})
}

func (e *Echo) Use(middleware ...MiddlewareFunc) {
	e.middleware = append(e.middleware, middleware...)
}

func (e *Echo) add(method, path string, handler HandlerFunc) {
	e.routes = append(e.routes, &route{method: method, path: path, handler: handler})
}

func (e *Echo) GET(path string, h HandlerFunc) {
	e.add(http.MethodGet, path, h)
}

func (e *Echo) POST(path string, h HandlerFunc) {
	e.add(http.MethodPost, path, h)
}

func (e *Echo) PUT(path string, h HandlerFunc) {
	e.add(http.MethodPut, path, h)
}

func (e *Echo) DELETE(path string, h HandlerFunc) {
	e.add(http.MethodDelete, path, h)
}

func (e *Echo) Group(prefix string) *Group {
	return &Group{prefix: prefix, e: e}
}

func (g *Group) add(method, path string, h HandlerFunc) {
	g.e.add(method, combinePath(g.prefix, path), h)
}

func (g *Group) GET(path string, h HandlerFunc)    { g.add(http.MethodGet, path, h) }
func (g *Group) POST(path string, h HandlerFunc)   { g.add(http.MethodPost, path, h) }
func (g *Group) PUT(path string, h HandlerFunc)    { g.add(http.MethodPut, path, h) }
func (g *Group) DELETE(path string, h HandlerFunc) { g.add(http.MethodDelete, path, h) }

func combinePath(prefix, path string) string {
	if path == "" {
		return prefix
	}
	if strings.HasSuffix(prefix, "/") {
		prefix = strings.TrimSuffix(prefix, "/")
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return prefix + path
}

func (e *Echo) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	for _, rt := range e.routes {
		if rt.method != r.Method {
			continue
		}
		params, ok := match(rt.path, r.URL.Path)
		if !ok {
			continue
		}

		ctx := &contextImpl{
			e:        e,
			request:  r,
			response: &Response{Writer: w},
			path:     rt.path,
			params:   params,
		}

		handler := rt.handler
		for i := len(e.middleware) - 1; i >= 0; i-- {
			handler = e.middleware[i](handler)
		}

		if err := handler(ctx); err != nil {
			e.handleError(err, ctx)
		}
		return
	}

	http.NotFound(w, r)
}

func (e *Echo) handleError(err error, c *contextImpl) {
	if e.HTTPErrorHandler != nil {
		e.HTTPErrorHandler(err, c)
		return
	}
	defaultHTTPErrorHandler(err, c)
}

func (e *Echo) Start(addr string) error {
	e.mu.Lock()
	e.httpServer = &http.Server{Addr: addr, Handler: e}
	e.mu.Unlock()
	err := e.httpServer.ListenAndServe()
	if errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return err
}

func (e *Echo) Shutdown(ctx context.Context) error {
	e.mu.Lock()
	server := e.httpServer
	e.mu.Unlock()
	if server == nil {
		return nil
	}
	return server.Shutdown(ctx)
}

func match(routePath, requestPath string) (map[string]string, bool) {
	if routePath == requestPath {
		return map[string]string{}, true
	}

	routeParts := strings.Split(strings.Trim(routePath, "/"), "/")
	requestParts := strings.Split(strings.Trim(requestPath, "/"), "/")

	if len(routeParts) != len(requestParts) {
		return nil, false
	}

	params := make(map[string]string)
	for idx := range routeParts {
		rp := routeParts[idx]
		qp := requestParts[idx]
		if strings.HasPrefix(rp, ":") {
			params[strings.TrimPrefix(rp, ":")] = qp
			continue
		}
		if rp != qp {
			return nil, false
		}
	}

	return params, true
}

func (c *contextImpl) Request() *http.Request { return c.request }

func (c *contextImpl) Response() *Response { return c.response }

func (c *contextImpl) JSON(code int, v any) error {
	if !c.response.committed {
		c.response.Header().Set(HeaderContentType, MIMEApplicationJSON)
	}
	c.response.WriteHeader(code)
	return json.NewEncoder(c.response.Writer).Encode(v)
}

func (c *contextImpl) NoContent(code int) error {
	c.response.WriteHeader(code)
	return nil
}

func (c *contextImpl) Bind(v any) error {
	decoder := json.NewDecoder(c.request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(v); err != nil {
		return err
	}
	return nil
}

func (c *contextImpl) Param(name string) string {
	return c.params[name]
}

func (c *contextImpl) Path() string {
	if c.request != nil && c.request.URL != nil {
		return c.request.URL.Path
	}
	return c.path
}

func NewHTTPError(code int, message any) *HTTPError {
	return &HTTPError{Code: code, Message: message}
}

func (h *HTTPError) Error() string {
	return fmt.Sprintf("%v", h.Message)
}

func (r *Response) WriteHeader(code int) {
	if r.committed {
		return
	}
	r.status = code
	r.committed = true
	r.Writer.WriteHeader(code)
}

func (r *Response) Write(b []byte) (int, error) {
	if !r.committed {
		r.WriteHeader(http.StatusOK)
	}
	return r.Writer.Write(b)
}

func (r *Response) Header() http.Header { return r.Writer.Header() }

func (r *Response) Committed() bool { return r.committed }

func (r *Response) Status() int { return r.status }

func (c *contextImpl) SetRequest(r *http.Request) {
	c.request = r
}
