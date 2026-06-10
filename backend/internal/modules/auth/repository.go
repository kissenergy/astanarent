package auth

import (
	"context"
	"database/sql"
	"errors"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, user User) (User, error) {
	query := `
		insert into users (name, phone, email, role, is_admin, password_hash)
		values ($1, $2, $3, $4, $5, $6)
		returning id, name, phone, email, role, is_admin, password_hash, created_at
	`

	var created User
	err := r.db.QueryRowContext(ctx, query, user.Name, user.Phone, user.Email, user.Role, user.IsAdmin, user.PasswordHash).
		Scan(&created.ID, &created.Name, &created.Phone, &created.Email, &created.Role, &created.IsAdmin, &created.PasswordHash, &created.CreatedAt)
	return created, err
}

func (r *Repository) FindByPhone(ctx context.Context, phone string) (User, error) {
	query := `
		select id, name, phone, email, role, is_admin, password_hash, created_at
		from users
		where phone = $1
	`

	var user User
	err := r.db.QueryRowContext(ctx, query, phone).
		Scan(&user.ID, &user.Name, &user.Phone, &user.Email, &user.Role, &user.IsAdmin, &user.PasswordHash, &user.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrInvalidCredentials
	}

	return user, err
}

func (r *Repository) FindByID(ctx context.Context, id string) (User, error) {
	query := `
		select id, name, phone, email, role, is_admin, password_hash, created_at
		from users
		where id = $1
	`

	var user User
	err := r.db.QueryRowContext(ctx, query, id).
		Scan(&user.ID, &user.Name, &user.Phone, &user.Email, &user.Role, &user.IsAdmin, &user.PasswordHash, &user.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrUnauthorized
	}

	return user, err
}

func (r *Repository) UpdateProfile(ctx context.Context, user User) (User, error) {
	query := `
		update users
		set name = $1, phone = $2, email = $3, updated_at = now()
		where id = $4
		returning id, name, phone, email, role, is_admin, password_hash, created_at
	`

	var updated User
	err := r.db.QueryRowContext(ctx, query, user.Name, user.Phone, user.Email, user.ID).
		Scan(&updated.ID, &updated.Name, &updated.Phone, &updated.Email, &updated.Role, &updated.IsAdmin, &updated.PasswordHash, &updated.CreatedAt)
	return updated, err
}

func (r *Repository) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := r.db.QueryContext(ctx, `
		select id, name, phone, email, role, is_admin, password_hash, created_at
		from users
		order by created_at desc
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]User, 0)
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Name, &user.Phone, &user.Email, &user.Role, &user.IsAdmin, &user.PasswordHash, &user.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, rows.Err()
}

func (r *Repository) SetUserRole(ctx context.Context, userID string, role string) (User, error) {
	query := `
		update users
		set role = $1, updated_at = now()
		where id = $2
		returning id, name, phone, email, role, is_admin, password_hash, created_at
	`
	var updated User
	err := r.db.QueryRowContext(ctx, query, role, userID).
		Scan(&updated.ID, &updated.Name, &updated.Phone, &updated.Email, &updated.Role, &updated.IsAdmin, &updated.PasswordHash, &updated.CreatedAt)
	return updated, err
}

func (r *Repository) SetUserAdmin(ctx context.Context, userID string, isAdmin bool) (User, error) {
	query := `
		update users
		set is_admin = $1, updated_at = now()
		where id = $2
		returning id, name, phone, email, role, is_admin, password_hash, created_at
	`
	var updated User
	err := r.db.QueryRowContext(ctx, query, isAdmin, userID).
		Scan(&updated.ID, &updated.Name, &updated.Phone, &updated.Email, &updated.Role, &updated.IsAdmin, &updated.PasswordHash, &updated.CreatedAt)
	return updated, err
}
