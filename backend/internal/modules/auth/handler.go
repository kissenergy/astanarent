package auth

import (
	"errors"
	"net/http"

	"rent-astana/backend/internal/platform/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/auth/register", h.register)
	mux.HandleFunc("POST /api/auth/login", h.login)
	mux.HandleFunc("GET /api/auth/me", h.me)
	mux.HandleFunc("PATCH /api/auth/me", h.updateMe)
	mux.HandleFunc("GET /api/admin/users", h.listUsers)
	mux.HandleFunc("PATCH /api/admin/users/{id}/role", h.setUserRole)
	mux.HandleFunc("PATCH /api/admin/users/{id}/admin", h.setUserAdmin)
}

func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "некорректный запрос")
		return
	}

	response, err := h.service.Register(r.Context(), req)
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	httpx.JSON(w, http.StatusCreated, response)
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "некорректный запрос")
		return
	}

	response, err := h.service.Login(r.Context(), req)
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	httpx.JSON(w, http.StatusOK, response)
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	user, err := h.service.Authenticate(r.Context(), r.Header.Get("Authorization"))
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	httpx.JSON(w, http.StatusOK, user)
}

func (h *Handler) updateMe(w http.ResponseWriter, r *http.Request) {
	user, err := h.service.Authenticate(r.Context(), r.Header.Get("Authorization"))
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	var req UpdateProfileRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "некорректный запрос")
		return
	}

	updated, err := h.service.UpdateProfile(r.Context(), user, req)
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	httpx.JSON(w, http.StatusOK, updated)
}

func (h *Handler) listUsers(w http.ResponseWriter, r *http.Request) {
	admin, err := h.service.Authenticate(r.Context(), r.Header.Get("Authorization"))
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	users, err := h.service.ListUsers(r.Context(), admin)
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	httpx.JSON(w, http.StatusOK, users)
}

func (h *Handler) setUserRole(w http.ResponseWriter, r *http.Request) {
	admin, err := h.service.Authenticate(r.Context(), r.Header.Get("Authorization"))
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	var req SetUserRoleRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "некорректный запрос")
		return
	}

	user, err := h.service.SetUserRole(r.Context(), admin, r.PathValue("id"), req.Role)
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	httpx.JSON(w, http.StatusOK, user)
}

func (h *Handler) setUserAdmin(w http.ResponseWriter, r *http.Request) {
	admin, err := h.service.Authenticate(r.Context(), r.Header.Get("Authorization"))
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	var req SetUserAdminRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "некорректный запрос")
		return
	}

	user, err := h.service.SetUserAdmin(r.Context(), admin, r.PathValue("id"), req.IsAdmin)
	if err != nil {
		h.writeAuthError(w, err)
		return
	}

	httpx.JSON(w, http.StatusOK, user)
}

func (h *Handler) writeAuthError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrUnauthorized):
		httpx.Error(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, ErrInvalidCredentials):
		httpx.Error(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, ErrPhoneAlreadyUsed):
		httpx.Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, ErrOnlyRealtor):
		httpx.Error(w, http.StatusForbidden, err.Error())
	case errors.Is(err, ErrOnlyAdmin):
		httpx.Error(w, http.StatusForbidden, err.Error())
	default:
		httpx.Error(w, http.StatusBadRequest, err.Error())
	}
}
