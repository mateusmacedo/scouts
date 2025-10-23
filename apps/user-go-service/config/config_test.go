package config

import "testing"

func TestLoadDefaults(t *testing.T) {
	t.Setenv("PORT", "")
	t.Setenv("LOG_LEVEL", "")
	t.Setenv("CORS_ORIGINS", "")

	cfg := Load()

	if cfg.Port != ":8080" {
		t.Fatalf("expected default port :8080 got %s", cfg.Port)
	}

	if cfg.LogLevel != "INFO" {
		t.Fatalf("expected default log level INFO got %s", cfg.LogLevel)
	}

	if len(cfg.CORSOrigins) != 0 {
		t.Fatalf("expected empty cors origins got %v", cfg.CORSOrigins)
	}
}

func TestLoadWithEnvironment(t *testing.T) {
	t.Setenv("PORT", "9090")
	t.Setenv("LOG_LEVEL", "debug")
	t.Setenv("CORS_ORIGINS", "https://example.com, https://example.org ")

	cfg := Load()

	if cfg.Port != ":9090" {
		t.Fatalf("expected :9090 got %s", cfg.Port)
	}

	if cfg.LogLevel != "DEBUG" {
		t.Fatalf("expected DEBUG got %s", cfg.LogLevel)
	}

	if len(cfg.CORSOrigins) != 2 {
		t.Fatalf("expected 2 origins got %v", cfg.CORSOrigins)
	}

	expected := []string{"https://example.com", "https://example.org"}
	for i, origin := range expected {
		if cfg.CORSOrigins[i] != origin {
			t.Fatalf("expected origin %s at position %d got %s", origin, i, cfg.CORSOrigins[i])
		}
	}
}
