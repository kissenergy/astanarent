package listings

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

func (r *Repository) ListFeed(ctx context.Context) ([]Listing, error) {
	query := `
		select
			l.id, l.realtor_id, l.title, l.price_month, l.address_text, l.description,
			l.realtor_phone, l.listing_phone, l.status, l.created_at, u.name,
			coalesce(avg(rv.rating), 0)::float,
			count(rv.id)::int
		from listings l
		join users u on u.id = l.realtor_id
		left join reviews rv on rv.listing_id = l.id
		where l.status in ('active', 'rented')
		group by l.id, u.name
		order by l.created_at desc
		limit 50
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Listing, 0)
	for rows.Next() {
		item, err := scanListing(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return r.withChildren(ctx, list)
}

func (r *Repository) FindByID(ctx context.Context, id string) (Listing, error) {
	query := `
		select
			l.id, l.realtor_id, l.title, l.price_month, l.address_text, l.description,
			l.realtor_phone, l.listing_phone, l.status, l.created_at, u.name,
			coalesce(avg(rv.rating), 0)::float,
			count(rv.id)::int
		from listings l
		join users u on u.id = l.realtor_id
		left join reviews rv on rv.listing_id = l.id
		where l.id = $1
		group by l.id, u.name
	`

	row := r.db.QueryRowContext(ctx, query, id)
	listing, err := scanListing(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Listing{}, ErrListingNotFound
	}
	if err != nil {
		return Listing{}, err
	}

	items, err := r.withChildren(ctx, []Listing{listing})
	if err != nil {
		return Listing{}, err
	}
	return items[0], nil
}

func (r *Repository) ListByRealtor(ctx context.Context, realtorID string) ([]Listing, error) {
	query := `
		select
			l.id, l.realtor_id, l.title, l.price_month, l.address_text, l.description,
			l.realtor_phone, l.listing_phone, l.status, l.created_at, u.name,
			coalesce(avg(rv.rating), 0)::float,
			count(rv.id)::int
		from listings l
		join users u on u.id = l.realtor_id
		left join reviews rv on rv.listing_id = l.id
		where l.realtor_id = $1
		group by l.id, u.name
		order by l.created_at desc
	`
	rows, err := r.db.QueryContext(ctx, query, realtorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Listing, 0)
	for rows.Next() {
		item, err := scanListing(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return r.withChildren(ctx, list)
}

func (r *Repository) ListFavorites(ctx context.Context, userID string) ([]Listing, error) {
	query := `
		select
			l.id, l.realtor_id, l.title, l.price_month, l.address_text, l.description,
			l.realtor_phone, l.listing_phone, l.status, l.created_at, u.name,
			coalesce(avg(rv.rating), 0)::float,
			count(rv.id)::int
		from favorites f
		join listings l on l.id = f.listing_id
		join users u on u.id = l.realtor_id
		left join reviews rv on rv.listing_id = l.id
		where f.user_id = $1
		group by l.id, u.name, f.created_at
		order by f.created_at desc
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Listing, 0)
	for rows.Next() {
		item, err := scanListing(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return r.withChildren(ctx, list)
}

func (r *Repository) Create(ctx context.Context, realtorID string, req CreateListingRequest) (Listing, error) {
	query := `
		insert into listings (realtor_id, title, price_month, address_text, description, realtor_phone, listing_phone)
		values ($1, $2, $3, $4, $5, $6, $7)
		returning id
	`
	var id string
	err := r.db.QueryRowContext(ctx, query, realtorID, req.Title, req.PriceMonth, req.AddressText, req.Description, req.RealtorPhone, req.ListingPhone).Scan(&id)
	if err != nil {
		return Listing{}, err
	}
	return r.FindByID(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id string, realtorID string, req UpdateListingRequest) (Listing, error) {
	current, err := r.FindByID(ctx, id)
	if err != nil {
		return Listing{}, err
	}
	if current.RealtorID != realtorID {
		return Listing{}, ErrForbidden
	}

	title := current.Title
	price := current.PriceMonth
	address := current.AddressText
	description := current.Description
	realtorPhone := current.RealtorPhone
	listingPhone := current.ListingPhone
	status := current.Status

	if req.Title != nil {
		title = *req.Title
	}
	if req.PriceMonth != nil {
		price = *req.PriceMonth
	}
	if req.AddressText != nil {
		address = *req.AddressText
	}
	if req.Description != nil {
		description = *req.Description
	}
	if req.RealtorPhone != nil {
		realtorPhone = *req.RealtorPhone
	}
	if req.ListingPhone != nil {
		listingPhone = *req.ListingPhone
	}
	if req.Status != nil {
		status = *req.Status
	}

	_, err = r.db.ExecContext(ctx, `
		update listings
		set title=$1, price_month=$2, address_text=$3, description=$4, realtor_phone=$5, listing_phone=$6, status=$7, updated_at=now()
		where id=$8 and realtor_id=$9
	`, title, price, address, description, realtorPhone, listingPhone, status, id, realtorID)
	if err != nil {
		return Listing{}, err
	}

	return r.FindByID(ctx, id)
}

func (r *Repository) AddMedia(ctx context.Context, listingID string, realtorID string, media Media) (Media, error) {
	listing, err := r.FindByID(ctx, listingID)
	if err != nil {
		return Media{}, err
	}
	if listing.RealtorID != realtorID {
		return Media{}, ErrForbidden
	}

	query := `
		insert into listing_media (listing_id, url, type, sort_order)
		values ($1, $2, $3, $4)
		returning id, listing_id, url, type, sort_order
	`
	var created Media
	err = r.db.QueryRowContext(ctx, query, listingID, media.URL, media.Type, media.SortOrder).
		Scan(&created.ID, &created.ListingID, &created.URL, &created.Type, &created.SortOrder)
	return created, err
}

func (r *Repository) DeleteMedia(ctx context.Context, listingID string, realtorID string, mediaID string) (Media, error) {
	listing, err := r.FindByID(ctx, listingID)
	if err != nil {
		return Media{}, err
	}
	if listing.RealtorID != realtorID {
		return Media{}, ErrForbidden
	}

	var deleted Media
	err = r.db.QueryRowContext(ctx, `
		delete from listing_media
		where id=$1 and listing_id=$2
		returning id, listing_id, url, type, sort_order
	`, mediaID, listingID).Scan(&deleted.ID, &deleted.ListingID, &deleted.URL, &deleted.Type, &deleted.SortOrder)
	if errors.Is(err, sql.ErrNoRows) {
		return Media{}, ErrListingNotFound
	}
	return deleted, err
}

func (r *Repository) AddReview(ctx context.Context, listingID string, userID string, req CreateReviewRequest) (Review, error) {
	query := `
		insert into reviews (listing_id, user_id, rating, text)
		values ($1, $2, $3, $4)
		on conflict (listing_id, user_id)
		do update set rating = excluded.rating, text = excluded.text, created_at = now()
		returning id, listing_id, user_id, rating, text, created_at
	`
	var review Review
	err := r.db.QueryRowContext(ctx, query, listingID, userID, req.Rating, req.Text).
		Scan(&review.ID, &review.ListingID, &review.UserID, &review.Rating, &review.Text, &review.CreatedAt)
	return review, err
}

func (r *Repository) ToggleFavorite(ctx context.Context, listingID string, userID string) error {
	result, err := r.db.ExecContext(ctx, `delete from favorites where listing_id=$1 and user_id=$2`, listingID, userID)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected > 0 {
		return nil
	}

	_, err = r.db.ExecContext(ctx, `insert into favorites (listing_id, user_id) values ($1, $2)`, listingID, userID)
	return err
}

func (r *Repository) withChildren(ctx context.Context, list []Listing) ([]Listing, error) {
	for i := range list {
		media, err := r.listMedia(ctx, list[i].ID)
		if err != nil {
			return nil, err
		}
		reviews, err := r.listReviews(ctx, list[i].ID, 3)
		if err != nil {
			return nil, err
		}
		list[i].Media = media
		list[i].ReviewPreviews = reviews
	}

	return list, nil
}

func (r *Repository) listMedia(ctx context.Context, listingID string) ([]Media, error) {
	rows, err := r.db.QueryContext(ctx, `
		select id, listing_id, url, type, sort_order
		from listing_media
		where listing_id=$1
		order by sort_order asc, created_at asc
	`, listingID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var media []Media
	for rows.Next() {
		var item Media
		if err := rows.Scan(&item.ID, &item.ListingID, &item.URL, &item.Type, &item.SortOrder); err != nil {
			return nil, err
		}
		media = append(media, item)
	}
	return media, rows.Err()
}

func (r *Repository) listReviews(ctx context.Context, listingID string, limit int) ([]Review, error) {
	rows, err := r.db.QueryContext(ctx, `
		select rv.id, rv.listing_id, rv.user_id, u.name, rv.rating, rv.text, rv.created_at
		from reviews rv
		join users u on u.id = rv.user_id
		where rv.listing_id=$1
		order by rv.created_at desc
		limit $2
	`, listingID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []Review
	for rows.Next() {
		var item Review
		if err := rows.Scan(&item.ID, &item.ListingID, &item.UserID, &item.UserName, &item.Rating, &item.Text, &item.CreatedAt); err != nil {
			return nil, err
		}
		reviews = append(reviews, item)
	}
	return reviews, rows.Err()
}

type listingScanner interface {
	Scan(dest ...any) error
}

func scanListing(scanner listingScanner) (Listing, error) {
	var item Listing
	err := scanner.Scan(
		&item.ID,
		&item.RealtorID,
		&item.Title,
		&item.PriceMonth,
		&item.AddressText,
		&item.Description,
		&item.RealtorPhone,
		&item.ListingPhone,
		&item.Status,
		&item.CreatedAt,
		&item.RealtorName,
		&item.AverageRating,
		&item.ReviewsCount,
	)
	return item, err
}
