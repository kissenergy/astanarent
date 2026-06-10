package listings

import (
	"errors"
	"net/http"

	"rent-astana/backend/internal/modules/auth"
	"rent-astana/backend/internal/platform/httpx"
)

type Handler struct {
	service *Service
	auth    *auth.Service
}

func NewHandler(service *Service, authService *auth.Service) *Handler {
	return &Handler{service: service, auth: authService}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/listings", h.feed)
	mux.HandleFunc("POST /api/listings", h.create)
	mux.HandleFunc("GET /api/listings/{id}", h.details)
	mux.HandleFunc("PATCH /api/listings/{id}", h.update)
	mux.HandleFunc("POST /api/listings/{id}/media", h.uploadMedia)
	mux.HandleFunc("DELETE /api/listings/{id}/media/{mediaId}", h.deleteMedia)
	mux.HandleFunc("POST /api/listings/{id}/reviews", h.addReview)
	mux.HandleFunc("POST /api/listings/{id}/favorite", h.toggleFavorite)
	mux.HandleFunc("GET /api/realtor/listings", h.mine)
	mux.HandleFunc("GET /api/favorites", h.favorites)
}

func (h *Handler) feed(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.Feed(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "не удалось загрузить ленту")
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

func (h *Handler) details(w http.ResponseWriter, r *http.Request) {
	item, err := h.service.Details(r.Context(), r.PathValue("id"))
	if err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	var req CreateListingRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "некорректный запрос")
		return
	}

	item, err := h.service.Create(r.Context(), user, req)
	if err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, item)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	var req UpdateListingRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "некорректный запрос")
		return
	}

	item, err := h.service.Update(r.Context(), user, r.PathValue("id"), req)
	if err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (h *Handler) uploadMedia(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	if err := r.ParseMultipartForm(95 << 20); err != nil {
		httpx.Error(w, http.StatusBadRequest, "файл слишком большой или некорректный")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "файл обязателен")
		return
	}
	defer file.Close()

	media, err := h.service.UploadMedia(r.Context(), user, r.PathValue("id"), file, header)
	if err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, media)
}

func (h *Handler) deleteMedia(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	if err := h.service.DeleteMedia(r.Context(), user, r.PathValue("id"), r.PathValue("mediaId")); err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) addReview(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	var req CreateReviewRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "некорректный запрос")
		return
	}

	review, err := h.service.AddReview(r.Context(), user, r.PathValue("id"), req)
	if err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, review)
}

func (h *Handler) toggleFavorite(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	if err := h.service.ToggleFavorite(r.Context(), user, r.PathValue("id")); err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) mine(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	list, err := h.service.Mine(r.Context(), user)
	if err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

func (h *Handler) favorites(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	list, err := h.service.Favorites(r.Context(), user)
	if err != nil {
		h.writeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

func (h *Handler) requireUser(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	user, err := h.auth.Authenticate(r.Context(), r.Header.Get("Authorization"))
	if err != nil {
		h.writeError(w, err)
		return auth.User{}, false
	}
	return user, true
}

func (h *Handler) writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, auth.ErrUnauthorized):
		httpx.Error(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, auth.ErrOnlyRealtor):
		httpx.Error(w, http.StatusForbidden, err.Error())
	case errors.Is(err, ErrForbidden):
		httpx.Error(w, http.StatusForbidden, err.Error())
	case errors.Is(err, ErrListingNotFound):
		httpx.Error(w, http.StatusNotFound, err.Error())
	default:
		httpx.Error(w, http.StatusBadRequest, err.Error())
	}
}
