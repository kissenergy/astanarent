package listings

import "time"

const (
	StatusActive   = "active"
	StatusRented   = "rented"
	StatusArchived = "archived"
)

type Listing struct {
	ID             string    `json:"id"`
	RealtorID      string    `json:"realtorId"`
	Title          string    `json:"title"`
	PriceMonth     int       `json:"priceMonth"`
	AddressText    string    `json:"addressText"`
	Description    string    `json:"description"`
	RealtorPhone   string    `json:"realtorPhone"`
	ListingPhone   string    `json:"listingPhone"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
	RealtorName    string    `json:"realtorName"`
	AverageRating  float64   `json:"averageRating"`
	ReviewsCount   int       `json:"reviewsCount"`
	Media          []Media   `json:"media"`
	ReviewPreviews []Review  `json:"reviewPreviews"`
}

type Media struct {
	ID        string `json:"id"`
	ListingID string `json:"listingId"`
	URL       string `json:"url"`
	Type      string `json:"type"`
	SortOrder int    `json:"sortOrder"`
}

type Review struct {
	ID        string    `json:"id"`
	ListingID string    `json:"listingId"`
	UserID    string    `json:"userId"`
	UserName  string    `json:"userName"`
	Rating    int       `json:"rating"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"createdAt"`
}

type CreateListingRequest struct {
	Title        string `json:"title"`
	PriceMonth   int    `json:"priceMonth"`
	AddressText  string `json:"addressText"`
	Description  string `json:"description"`
	RealtorPhone string `json:"realtorPhone"`
	ListingPhone string `json:"listingPhone"`
}

type UpdateListingRequest struct {
	Title        *string `json:"title"`
	PriceMonth   *int    `json:"priceMonth"`
	AddressText  *string `json:"addressText"`
	Description  *string `json:"description"`
	RealtorPhone *string `json:"realtorPhone"`
	ListingPhone *string `json:"listingPhone"`
	Status       *string `json:"status"`
}

type CreateReviewRequest struct {
	Rating int    `json:"rating"`
	Text   string `json:"text"`
}
