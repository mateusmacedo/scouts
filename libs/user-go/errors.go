package gouser

import "errors"

// Custom errors for the user domain
var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrInvalidEmail      = errors.New("invalid email format")
	ErrInvalidPhone      = errors.New("invalid phone format")
	ErrEmptyName         = errors.New("name cannot be empty")
	ErrEmptyEmail        = errors.New("email cannot be empty")
)
