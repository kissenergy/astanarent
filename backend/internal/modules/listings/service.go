package listings

import (
	"context"
	"errors"
	"mime/multipart"
	"strings"

	"rent-astana/backend/internal/modules/auth"
	"rent-astana/backend/internal/platform/storage"
)

var (
	ErrListingNotFound = errors.New("объявление не найдено")
	ErrForbidden       = errors.New("нет доступа к этому объявлению")
	ErrInvalidListing  = errors.New("проверьте данные объявления")
)

const (
	maxImageBytes = 12 << 20
	maxVideoBytes = 80 << 20
)

type Service struct {
	repo    *Repository
	storage *storage.LocalStorage
}

func NewService(repo *Repository, storage *storage.LocalStorage) *Service {
	return &Service{repo: repo, storage: storage}
}

func (s *Service) Feed(ctx context.Context) ([]Listing, error) {
	return s.repo.ListFeed(ctx)
}

func (s *Service) Details(ctx context.Context, id string) (Listing, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) Mine(ctx context.Context, user auth.User) ([]Listing, error) {
	if user.Role != auth.RoleRealtor {
		return nil, auth.ErrOnlyRealtor
	}
	return s.repo.ListByRealtor(ctx, user.ID)
}

func (s *Service) Favorites(ctx context.Context, user auth.User) ([]Listing, error) {
	return s.repo.ListFavorites(ctx, user.ID)
}

func (s *Service) Create(ctx context.Context, user auth.User, req CreateListingRequest) (Listing, error) {
	if user.Role != auth.RoleRealtor {
		return Listing{}, auth.ErrOnlyRealtor
	}
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.AddressText) == "" || req.PriceMonth <= 0 {
		return Listing{}, ErrInvalidListing
	}
	if strings.TrimSpace(req.RealtorPhone) == "" || strings.TrimSpace(req.ListingPhone) == "" {
		return Listing{}, errors.New("телефон риелтора и телефон объявления обязательны")
	}

	req.Title = strings.TrimSpace(req.Title)
	req.AddressText = strings.TrimSpace(req.AddressText)
	req.Description = strings.TrimSpace(req.Description)
	req.RealtorPhone = user.Phone
	return s.repo.Create(ctx, user.ID, req)
}

func (s *Service) Update(ctx context.Context, user auth.User, id string, req UpdateListingRequest) (Listing, error) {
	if user.Role != auth.RoleRealtor {
		return Listing{}, auth.ErrOnlyRealtor
	}
	if req.Status != nil && *req.Status != StatusActive && *req.Status != StatusRented && *req.Status != StatusArchived {
		return Listing{}, errors.New("некорректный статус объявления")
	}
	return s.repo.Update(ctx, id, user.ID, req)
}

func (s *Service) UploadMedia(ctx context.Context, user auth.User, listingID string, file multipart.File, header *multipart.FileHeader) (Media, error) {
	if user.Role != auth.RoleRealtor {
		return Media{}, auth.ErrOnlyRealtor
	}

	contentType := strings.ToLower(header.Header.Get("Content-Type"))
	mediaType, err := validateMediaFile(contentType, header.Size)
	if err != nil {
		return Media{}, err
	}

	_, url, err := s.storage.SaveListingFile(listingID, file, header)
	if err != nil {
		return Media{}, err
	}

	return s.repo.AddMedia(ctx, listingID, user.ID, Media{URL: url, Type: mediaType})
}

func (s *Service) DeleteMedia(ctx context.Context, user auth.User, listingID string, mediaID string) error {
	if user.Role != auth.RoleRealtor {
		return auth.ErrOnlyRealtor
	}
	media, err := s.repo.DeleteMedia(ctx, listingID, user.ID, mediaID)
	if err != nil {
		return err
	}
	return s.storage.DeletePublicURL(media.URL)
}

func (s *Service) AddReview(ctx context.Context, user auth.User, listingID string, req CreateReviewRequest) (Review, error) {
	if req.Rating < 1 || req.Rating > 5 || strings.TrimSpace(req.Text) == "" {
		return Review{}, errors.New("оценка и текст отзыва обязательны")
	}
	req.Text = strings.TrimSpace(req.Text)
	return s.repo.AddReview(ctx, listingID, user.ID, req)
}

func (s *Service) ToggleFavorite(ctx context.Context, user auth.User, listingID string) error {
	return s.repo.ToggleFavorite(ctx, listingID, user.ID)
}

func validateMediaFile(contentType string, size int64) (string, error) {
	switch contentType {
	case "image/jpeg", "image/png", "image/webp":
		if size > maxImageBytes {
			return "", errors.New("фото должно быть не больше 12 МБ")
		}
		return "photo", nil
	case "video/mp4", "video/quicktime", "video/webm":
		if size > maxVideoBytes {
			return "", errors.New("видео должно быть не больше 80 МБ")
		}
		return "video", nil
	default:
		return "", errors.New("можно загрузить только JPG, PNG, WebP, MP4, MOV или WebM")
	}
}
