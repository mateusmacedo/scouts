package config

import (
	"os"
	"strings"
)

type Config struct {
	Port        string
	LogLevel    string
	CORSOrigins []string
}

func Load() Config {
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}
	if !strings.HasPrefix(port, ":") {
		port = ":" + port
	}

	logLevel := strings.TrimSpace(os.Getenv("LOG_LEVEL"))
	if logLevel == "" {
		logLevel = "INFO"
	}
	logLevel = strings.ToUpper(logLevel)

	origins := []string{}
	rawOrigins := strings.TrimSpace(os.Getenv("CORS_ORIGINS"))
	if rawOrigins != "" {
		for _, origin := range strings.Split(rawOrigins, ",") {
			trimmed := strings.TrimSpace(origin)
			if trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}

	return Config{
		Port:        port,
		LogLevel:    logLevel,
		CORSOrigins: origins,
	}
}
