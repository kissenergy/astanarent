export type ListingReviewPreview = {
  id: string;
  authorName: string;
  rating: number;
  text: string;
};

export type ListingMediaItem = {
  url: string;
  type: 'photo' | 'video';
  sortOrder: number;
};

export type ListingFeedItem = {
  id: string;
  title: string;
  address: string;
  priceLabel: string;
  realtorName: string;
  listingPhone: string;
  realtorPhone: string;
  description: string;
  ratingLabel: string;
  reviewsCount: number;
  statusLabel: 'Сдано' | 'Не сдано';
  imageUrl: string;
  media: ListingMediaItem[];
  reviews: ListingReviewPreview[];
};
