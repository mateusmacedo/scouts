package gouser

import (
	"regexp"
	"strings"
)

// EmailRegex is a simple email validation regex
var EmailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// PhoneRegex is a simple phone validation regex (supports international format)
var PhoneRegex = regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)

// ValidateCreateUserData validates CreateUserData
func ValidateCreateUserData(data CreateUserData) error {
	if strings.TrimSpace(data.Name) == "" {
		return ErrEmptyName
	}

	if strings.TrimSpace(data.Email) == "" {
		return ErrEmptyEmail
	}

	if !EmailRegex.MatchString(data.Email) {
		return ErrInvalidEmail
	}

	if data.Phone != "" && !PhoneRegex.MatchString(data.Phone) {
		return ErrInvalidPhone
	}

	return nil
}

// ValidateUpdateUserData validates UpdateUserData
func ValidateUpdateUserData(data UpdateUserData) error {
	if data.Name != nil && strings.TrimSpace(*data.Name) == "" {
		return ErrEmptyName
	}

	if data.Email != nil {
		if strings.TrimSpace(*data.Email) == "" {
			return ErrEmptyEmail
		}
		if !EmailRegex.MatchString(*data.Email) {
			return ErrInvalidEmail
		}
	}

	if data.Phone != nil && *data.Phone != "" && !PhoneRegex.MatchString(*data.Phone) {
		return ErrInvalidPhone
	}

	return nil
}
