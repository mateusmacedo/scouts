package user

import (
	"errors"
	"regexp"
	"strings"
)

var (
	// ErrInvalidName é retornado quando o nome não atende aos requisitos mínimos.
	ErrInvalidName = errors.New("invalid name")
	// ErrInvalidEmail indica que o formato do e-mail é inválido.
	ErrInvalidEmail = errors.New("invalid email")
	// ErrInvalidPhone informa que o telefone fornecido é inválido.
	ErrInvalidPhone = errors.New("invalid phone")
)

var emailRegex = regexp.MustCompile(`^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`)

// ValidateName normaliza e valida o nome informado.
func ValidateName(name string) (string, error) {
	normalized := strings.TrimSpace(name)
	if len([]rune(normalized)) < 3 {
		return "", ErrInvalidName
	}

	return normalized, nil
}

// ValidateEmail normaliza o e-mail para caixa baixa e valida o formato.
func ValidateEmail(email string) (string, error) {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if !emailRegex.MatchString(normalized) {
		return "", ErrInvalidEmail
	}

	return normalized, nil
}

// ValidatePhone remove caracteres de formatação opcionais e valida o telefone.
func ValidatePhone(phone string) (string, error) {
	trimmed := strings.TrimSpace(phone)
	if trimmed == "" {
		return "", ErrInvalidPhone
	}

	var digits strings.Builder
	hasPlus := false

	for idx, r := range trimmed {
		switch {
		case r >= '0' && r <= '9':
			digits.WriteRune(r)
		case r == '+' && idx == 0:
			hasPlus = true
		case r == ' ' || r == '-' || r == '(' || r == ')' || r == '.':
			continue
		default:
			return "", ErrInvalidPhone
		}
	}

	normalized := digits.String()
	if len(normalized) < 10 || len(normalized) > 15 {
		return "", ErrInvalidPhone
	}

	if hasPlus {
		return "+" + normalized, nil
	}

	return normalized, nil
}
