package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userService *gouser.UserService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService *gouser.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// CreateUserRequest represents the request body for creating a user
type CreateUserRequest struct {
	Name    string `json:"name" validate:"required,min=2,max=100"`
	Email   string `json:"email" validate:"required,email"`
	Phone   string `json:"phone,omitempty" validate:"omitempty,max=20"`
	Address string `json:"address,omitempty" validate:"omitempty,max=500"`
}

// UpdateUserRequest represents the request body for updating a user
type UpdateUserRequest struct {
	Name    *string `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
	Email   *string `json:"email,omitempty" validate:"omitempty,email"`
	Phone   *string `json:"phone,omitempty" validate:"omitempty,max=20"`
	Address *string `json:"address,omitempty" validate:"omitempty,max=500"`
}

// UserResponse represents the response for user operations
type UserResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Phone     string `json:"phone,omitempty"`
	Address   string `json:"address,omitempty"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// Create handles POST /api/v1/users
func (h *UserHandler) Create(c echo.Context) error {
	var req CreateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "Invalid request body",
		})
	}

	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: err.Error(),
		})
	}

	userData := gouser.CreateUserData{
		Name:    req.Name,
		Email:   req.Email,
		Phone:   req.Phone,
		Address: req.Address,
	}

	user, err := h.userService.Create(c.Request().Context(), userData)
	if err != nil {
		if err == gouser.ErrUserAlreadyExists {
			return c.JSON(http.StatusConflict, ErrorResponse{
				Error:   "user_already_exists",
				Message: "User with this email already exists",
			})
		}
		if err == gouser.ErrInvalidEmail {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "invalid_email",
				Message: "Invalid email format",
			})
		}
		if err == gouser.ErrEmptyName {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "empty_name",
				Message: "Name cannot be empty",
			})
		}
		if err == gouser.ErrInvalidPhone {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "invalid_phone",
				Message: "Invalid phone format",
			})
		}
		if err == gouser.ErrEmptyEmail {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "empty_email",
				Message: "Email cannot be empty",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to create user",
		})
	}

	response := UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Address:   user.Address,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	return c.JSON(http.StatusCreated, response)
}

// GetAll handles GET /api/v1/users
func (h *UserHandler) GetAll(c echo.Context) error {
	users, err := h.userService.FindAll(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to retrieve users",
		})
	}

	responses := make([]UserResponse, len(users))
	for i, user := range users {
		responses[i] = UserResponse{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Phone:     user.Phone,
			Address:   user.Address,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	return c.JSON(http.StatusOK, responses)
}

// GetByID handles GET /api/v1/users/:id
func (h *UserHandler) GetByID(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "User ID is required",
		})
	}

	user, err := h.userService.FindByID(c.Request().Context(), id)
	if err != nil {
		if err == gouser.ErrUserNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "user_not_found",
				Message: "User not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to retrieve user",
		})
	}

	response := UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Address:   user.Address,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	return c.JSON(http.StatusOK, response)
}

// Update handles PUT /api/v1/users/:id
func (h *UserHandler) Update(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "User ID is required",
		})
	}

	var req UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "Invalid request body",
		})
	}

	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: err.Error(),
		})
	}

	updateData := gouser.UpdateUserData{
		Name:    req.Name,
		Email:   req.Email,
		Phone:   req.Phone,
		Address: req.Address,
	}

	user, err := h.userService.Update(c.Request().Context(), id, updateData)
	if err != nil {
		if err == gouser.ErrUserNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "user_not_found",
				Message: "User not found",
			})
		}
		if err == gouser.ErrUserAlreadyExists {
			return c.JSON(http.StatusConflict, ErrorResponse{
				Error:   "user_already_exists",
				Message: "User with this email already exists",
			})
		}
		if err == gouser.ErrInvalidEmail {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "invalid_email",
				Message: "Invalid email format",
			})
		}
		if err == gouser.ErrEmptyName {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "empty_name",
				Message: "Name cannot be empty",
			})
		}
		if err == gouser.ErrInvalidPhone {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "invalid_phone",
				Message: "Invalid phone format",
			})
		}
		if err == gouser.ErrEmptyEmail {
			return c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "empty_email",
				Message: "Email cannot be empty",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to update user",
		})
	}

	response := UserResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Address:   user.Address,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	return c.JSON(http.StatusOK, response)
}

// Delete handles DELETE /api/v1/users/:id
func (h *UserHandler) Delete(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "User ID is required",
		})
	}

	err := h.userService.Delete(c.Request().Context(), id)
	if err != nil {
		if err == gouser.ErrUserNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "user_not_found",
				Message: "User not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "internal_error",
			Message: "Failed to delete user",
		})
	}

	return c.NoContent(http.StatusNoContent)
}
