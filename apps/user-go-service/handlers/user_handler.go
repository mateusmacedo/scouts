package handlers

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

type UserHandler struct {
	service *gouser.UserService
}

type createUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type updateUserRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email"`
}

func NewUserHandler(service *gouser.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) CreateUser(c echo.Context) error {
	var req createUserRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request payload")
	}

	user, err := h.service.CreateUser(c.Request().Context(), gouser.CreateUserInput{
		Name:  req.Name,
		Email: req.Email,
	})
	if err != nil {
		return handleServiceError(err)
	}

	return c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) ListUsers(c echo.Context) error {
	users, err := h.service.ListUsers(c.Request().Context())
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, users)
}

func (h *UserHandler) GetUser(c echo.Context) error {
	user, err := h.service.GetUser(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleServiceError(err)
	}

	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
	var req updateUserRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request payload")
	}

	user, err := h.service.UpdateUser(c.Request().Context(), c.Param("id"), gouser.UpdateUserInput{
		Name:  req.Name,
		Email: req.Email,
	})
	if err != nil {
		return handleServiceError(err)
	}

	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c echo.Context) error {
	if err := h.service.DeleteUser(c.Request().Context(), c.Param("id")); err != nil {
		return handleServiceError(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func handleServiceError(err error) error {
	switch {
	case errors.Is(err, gouser.ErrInvalidUser):
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	case errors.Is(err, gouser.ErrUserNotFound):
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	default:
		return err
	}
}
