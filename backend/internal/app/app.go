package app

import (
	"database/sql"
	"net/http"

	_ "github.com/jackc/pgx/v5/stdlib"

	"rent-astana/backend/internal/config"
	"rent-astana/backend/internal/db"
	"rent-astana/backend/internal/modules/auth"
	"rent-astana/backend/internal/modules/listings"
	"rent-astana/backend/internal/platform/httpx"
	"rent-astana/backend/internal/platform/storage"
)

type App struct {
	Config config.Config
	db     *sql.DB
	router http.Handler
}

func New() (*App, error) {
	cfg := config.Load()

	database, err := db.Open(cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	fileStorage := storage.NewLocal(cfg.UploadRoot, cfg.PublicBaseURL)
	authRepo := auth.NewRepository(database)
	authService := auth.NewService(authRepo, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService)

	listingRepo := listings.NewRepository(database)
	listingService := listings.NewService(listingRepo, fileStorage)
	listingHandler := listings.NewHandler(listingService, authService)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", httpx.HandleHealth)
	authHandler.RegisterRoutes(mux)
	listingHandler.RegisterRoutes(mux)
	mux.Handle("/media/", http.StripPrefix("/media/", http.FileServer(http.Dir(cfg.UploadRoot))))

	return &App{
		Config: cfg,
		db:     database,
		router: httpx.WithCORS(mux),
	}, nil
}

func (a *App) Router() http.Handler {
	return a.router
}

func (a *App) Close() {
	if a.db != nil {
		_ = a.db.Close()
	}
}
