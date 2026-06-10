package auth

import "time"

const (
	RoleClient  = "client"
	RoleRealtor = "realtor"
)

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Phone        string    `json:"phone"`
	Email        *string   `json:"email"`
	Role         string    `json:"role"`
	IsAdmin      bool      `json:"isAdmin"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
}

type RegisterRequest struct {
	Name     string  `json:"name"`
	Phone    string  `json:"phone"`
	Email    *string `json:"email"`
	Password string  `json:"password"`
}

type LoginRequest struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type UpdateProfileRequest struct {
	Name  *string `json:"name"`
	Phone *string `json:"phone"`
	Email *string `json:"email"`
}

type SetUserRoleRequest struct {
	Role string `json:"role"`
}

type SetUserAdminRequest struct {
	IsAdmin bool `json:"isAdmin"`
}

type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}
