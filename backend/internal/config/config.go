package config

import "os"

type Config struct {
	HTTPPort      string
	DatabaseURL   string
	JWTSecret     string
	UploadRoot    string
	PublicBaseURL string
}

func Load() Config {
	return Config{
		HTTPPort:      env("HTTP_PORT", "8080"),
		DatabaseURL:   env("DATABASE_URL", "postgres://rent:rent@localhost:5432/rent_astana?sslmode=disable"),
		JWTSecret:     env("JWT_SECRET", "local-dev-secret-change-on-server"),
		UploadRoot:    env("UPLOAD_ROOT", "C:/Users/zhanat/Desktop/bazarent"),
		PublicBaseURL: env("PUBLIC_BASE_URL", "http://localhost:8080"),
	}
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
