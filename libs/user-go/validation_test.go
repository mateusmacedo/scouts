package gouser

import (
	"testing"
)

func TestValidateCreateUserData(t *testing.T) {
	tests := []struct {
		name    string
		data    CreateUserData
		wantErr error
	}{
		{
			name: "valid data",
			data: CreateUserData{
				Name:    "John Doe",
				Email:   "john@example.com",
				Phone:   "+1234567890",
				Address: "123 Main St",
			},
			wantErr: nil,
		},
		{
			name: "valid data with minimal fields",
			data: CreateUserData{
				Name:  "John Doe",
				Email: "john@example.com",
			},
			wantErr: nil,
		},
		{
			name: "empty name",
			data: CreateUserData{
				Name:  "",
				Email: "john@example.com",
			},
			wantErr: ErrEmptyName,
		},
		{
			name: "whitespace only name",
			data: CreateUserData{
				Name:  "   ",
				Email: "john@example.com",
			},
			wantErr: ErrEmptyName,
		},
		{
			name: "empty email",
			data: CreateUserData{
				Name:  "John Doe",
				Email: "",
			},
			wantErr: ErrEmptyEmail,
		},
		{
			name: "invalid email format",
			data: CreateUserData{
				Name:  "John Doe",
				Email: "invalid-email",
			},
			wantErr: ErrInvalidEmail,
		},
		{
			name: "invalid email format 2",
			data: CreateUserData{
				Name:  "John Doe",
				Email: "john@",
			},
			wantErr: ErrInvalidEmail,
		},
		{
			name: "invalid phone format",
			data: CreateUserData{
				Name:  "John Doe",
				Email: "john@example.com",
				Phone: "invalid-phone",
			},
			wantErr: ErrInvalidPhone,
		},
		{
			name: "valid phone format",
			data: CreateUserData{
				Name:  "John Doe",
				Email: "john@example.com",
				Phone: "+1234567890",
			},
			wantErr: nil,
		},
		{
			name: "valid phone format without plus",
			data: CreateUserData{
				Name:  "John Doe",
				Email: "john@example.com",
				Phone: "1234567890",
			},
			wantErr: nil,
		},
		{
			name: "empty phone is valid",
			data: CreateUserData{
				Name:  "John Doe",
				Email: "john@example.com",
				Phone: "",
			},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCreateUserData(tt.data)
			if err != tt.wantErr {
				t.Errorf("ValidateCreateUserData() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateUpdateUserData(t *testing.T) {
	tests := []struct {
		name    string
		data    UpdateUserData
		wantErr error
	}{
		{
			name: "valid data",
			data: UpdateUserData{
				Name:    stringPtr("John Doe"),
				Email:   stringPtr("john@example.com"),
				Phone:   stringPtr("+1234567890"),
				Address: stringPtr("123 Main St"),
			},
			wantErr: nil,
		},
		{
			name: "valid partial data",
			data: UpdateUserData{
				Name: stringPtr("John Doe"),
			},
			wantErr: nil,
		},
		{
			name: "empty name",
			data: UpdateUserData{
				Name:  stringPtr(""),
				Email: stringPtr("john@example.com"),
			},
			wantErr: ErrEmptyName,
		},
		{
			name: "whitespace only name",
			data: UpdateUserData{
				Name:  stringPtr("   "),
				Email: stringPtr("john@example.com"),
			},
			wantErr: ErrEmptyName,
		},
		{
			name: "empty email",
			data: UpdateUserData{
				Name:  stringPtr("John Doe"),
				Email: stringPtr(""),
			},
			wantErr: ErrEmptyEmail,
		},
		{
			name: "invalid email format",
			data: UpdateUserData{
				Name:  stringPtr("John Doe"),
				Email: stringPtr("invalid-email"),
			},
			wantErr: ErrInvalidEmail,
		},
		{
			name: "invalid phone format",
			data: UpdateUserData{
				Name:  stringPtr("John Doe"),
				Email: stringPtr("john@example.com"),
				Phone: stringPtr("invalid-phone"),
			},
			wantErr: ErrInvalidPhone,
		},
		{
			name: "valid phone format",
			data: UpdateUserData{
				Name:  stringPtr("John Doe"),
				Email: stringPtr("john@example.com"),
				Phone: stringPtr("+1234567890"),
			},
			wantErr: nil,
		},
		{
			name: "empty phone is valid",
			data: UpdateUserData{
				Name:  stringPtr("John Doe"),
				Email: stringPtr("john@example.com"),
				Phone: stringPtr(""),
			},
			wantErr: nil,
		},
		{
			name:    "nil values are valid",
			data:    UpdateUserData{},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateUpdateUserData(tt.data)
			if err != tt.wantErr {
				t.Errorf("ValidateUpdateUserData() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}
