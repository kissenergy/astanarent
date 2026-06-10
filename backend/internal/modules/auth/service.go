package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"rent-astana/backend/internal/platform/security"
)

var (
	ErrInvalidCredentials = errors.New("неверный телефон или пароль")
	ErrUnauthorized       = errors.New("нужно войти в аккаунт")
	ErrPhoneAlreadyUsed   = errors.New("этот номер телефона уже зарегистрирован")
	ErrOnlyRealtor        = errors.New("это действие доступно только риелторам")
	ErrOnlyAdmin          = errors.New("это действие доступно только админу")
	ErrPrimaryAdminLocked = errors.New("главного админа нельзя лишить доступа")
)

type Service struct {
	repo      *Repository
	jwtSecret string
}

func NewService(repo *Repository, jwtSecret string) *Service {
	return &Service{repo: repo, jwtSecret: jwtSecret}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (AuthResponse, error) {
	phone, err := NormalizeKZPhone(req.Phone)
	if err != nil {
		return AuthResponse{}, err
	}

	if strings.TrimSpace(req.Name) == "" {
		return AuthResponse{}, errors.New("имя обязательно")
	}
	if len(req.Password) < 6 {
		return AuthResponse{}, errors.New("пароль должен быть минимум 6 символов")
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return AuthResponse{}, err
	}

	var email *string
	if req.Email != nil {
		normalizedEmail := strings.TrimSpace(strings.ToLower(*req.Email))
		if normalizedEmail != "" {
			email = &normalizedEmail
		}
	}

	user, err := s.repo.CreateUser(ctx, User{
		Name:         strings.TrimSpace(req.Name),
		Phone:        phone,
		Email:        email,
		Role:         RoleClient,
		IsAdmin:      phone == "+77075226839",
		PasswordHash: hash,
	})
	if err != nil {
		if strings.Contains(err.Error(), "users_phone_key") {
			return AuthResponse{}, ErrPhoneAlreadyUsed
		}
		return AuthResponse{}, err
	}

	token, err := s.tokenFor(user)
	if err != nil {
		return AuthResponse{}, err
	}

	return AuthResponse{User: user, Token: token}, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (AuthResponse, error) {
	phone, err := NormalizeKZPhone(req.Phone)
	if err != nil {
		return AuthResponse{}, ErrInvalidCredentials
	}

	user, err := s.repo.FindByPhone(ctx, phone)
	if err != nil {
		return AuthResponse{}, err
	}

	if !security.VerifyPassword(req.Password, user.PasswordHash) {
		return AuthResponse{}, ErrInvalidCredentials
	}

	token, err := s.tokenFor(user)
	if err != nil {
		return AuthResponse{}, err
	}

	return AuthResponse{User: user, Token: token}, nil
}

func (s *Service) Authenticate(ctx context.Context, bearer string) (User, error) {
	token, err := security.BearerToken(bearer)
	if err != nil {
		return User{}, ErrUnauthorized
	}

	claims, err := security.ParseJWT(token, s.jwtSecret)
	if err != nil {
		return User{}, ErrUnauthorized
	}

	return s.repo.FindByID(ctx, claims.Sub)
}

func (s *Service) UpdateProfile(ctx context.Context, user User, req UpdateProfileRequest) (User, error) {
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return User{}, errors.New("имя обязательно")
		}
		user.Name = name
	}
	if req.Phone != nil {
		phone, err := NormalizeKZPhone(*req.Phone)
		if err != nil {
			return User{}, err
		}
		user.Phone = phone
	}
	if req.Email != nil {
		email := strings.TrimSpace(strings.ToLower(*req.Email))
		if email == "" {
			user.Email = nil
		} else {
			user.Email = &email
		}
	}

	updated, err := s.repo.UpdateProfile(ctx, user)
	if err != nil {
		if strings.Contains(err.Error(), "users_phone_key") {
			return User{}, ErrPhoneAlreadyUsed
		}
		return User{}, err
	}
	return updated, nil
}

func (s *Service) RequireRealtor(user User) error {
	if user.Role != RoleRealtor {
		return ErrOnlyRealtor
	}

	return nil
}

func (s *Service) ListUsers(ctx context.Context, admin User) ([]User, error) {
	if !admin.IsAdmin {
		return nil, ErrOnlyAdmin
	}
	return s.repo.ListUsers(ctx)
}

func (s *Service) SetUserRole(ctx context.Context, admin User, userID string, role string) (User, error) {
	if !admin.IsAdmin {
		return User{}, ErrOnlyAdmin
	}
	if role != RoleClient && role != RoleRealtor {
		return User{}, errors.New("некорректная роль")
	}
	return s.repo.SetUserRole(ctx, userID, role)
}

func (s *Service) SetUserAdmin(ctx context.Context, admin User, userID string, isAdmin bool) (User, error) {
	if !admin.IsAdmin {
		return User{}, ErrOnlyAdmin
	}
	target, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return User{}, err
	}
	if target.Phone == "+77075226839" && !isAdmin {
		return User{}, ErrPrimaryAdminLocked
	}
	return s.repo.SetUserAdmin(ctx, userID, isAdmin)
}

func (s *Service) tokenFor(user User) (string, error) {
	return security.SignJWT(security.Claims{
		Sub:  user.ID,
		Role: user.Role,
		Exp:  time.Now().Add(30 * 24 * time.Hour).Unix(),
	}, s.jwtSecret)
}
