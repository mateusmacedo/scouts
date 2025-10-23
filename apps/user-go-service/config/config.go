package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds the application configuration
type Config struct {
	Port        string
	LogLevel    string
	CORSOrigins []string
	Environment string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	config := &Config{
		Port:        getEnv("PORT", "8080"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		CORSOrigins: getCORSOrigins(),
		Environment: getEnv("ENVIRONMENT", "development"),
	}

	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return config, nil
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Port == "" {
		return fmt.Errorf("PORT cannot be empty")
	}

	// Validate port is a number
	if _, err := strconv.Atoi(c.Port); err != nil {
		return fmt.Errorf("PORT must be a valid number: %w", err)
	}

	validLogLevels := []string{"debug", "info", "warn", "error"}
	if !contains(validLogLevels, c.LogLevel) {
		return fmt.Errorf("LOG_LEVEL must be one of: %s", strings.Join(validLogLevels, ", "))
	}

	validEnvironments := []string{"development", "staging", "production"}
	if !contains(validEnvironments, c.Environment) {
		return fmt.Errorf("ENVIRONMENT must be one of: %s", strings.Join(validEnvironments, ", "))
	}

	return nil
}

// IsDevelopment returns true if the environment is development
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction returns true if the environment is production
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getCORSOrigins gets CORS origins from environment variable
func getCORSOrigins() []string {
	origins := getEnv("CORS_ORIGINS", "*")
	if origins == "*" {
		return []string{"*"}
	}
	return strings.Split(origins, ",")
}

// contains checks if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
