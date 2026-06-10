import { apiRequest, uploadFile } from '../../../shared/api/api-client';
import { formatKztPerMonth, formatRating } from '../../../shared/lib/format';
import { ListingFeedItem } from '../domain/listing-feed-item';

export type ListingDTO = {
  id: string;
  title: string;
  priceMonth: number;
  addressText: string;
  description: string;
  realtorPhone: string;
  listingPhone: string;
  status: 'active' | 'rented' | 'archived';
  realtorName: string;
  averageRating: number;
  reviewsCount: number;
  media: { id: string; url: string; type: 'photo' | 'video'; sortOrder: number }[] | null;
  reviewPreviews: { id: string; userName: string; rating: number; text: string }[] | null;
};

export async function getFeedListings(): Promise<ListingFeedItem[]> {
  const data = await apiRequest<ListingDTO[]>('/listings');
  return data.map(mapListingRowToFeedItem);
}

export async function getListingDetails(id: string) {
  return apiRequest<ListingDTO>(`/listings/${id}`);
}

export async function toggleFavorite(listingId: string) {
  return apiRequest<{ ok: boolean }>(`/listings/${listingId}/favorite`, {
    method: 'POST',
    authenticated: true,
  });
}

export async function addListingReview(listingId: string, payload: { rating: number; text: string }) {
  return apiRequest<{ id: string }>(`/listings/${listingId}/reviews`, {
    method: 'POST',
    authenticated: true,
    body: payload,
  });
}

export async function createListing(payload: {
  title: string;
  priceMonth: number;
  addressText: string;
  description: string;
  realtorPhone: string;
  listingPhone: string;
}) {
  return apiRequest<ListingDTO>('/listings', {
    method: 'POST',
    authenticated: true,
    body: payload,
  });
}

export async function uploadListingMedia(listingId: string, fileUri: string, fileName: string, mimeType: string) {
  return uploadFile(`/listings/${listingId}/media`, fileUri, fileName, mimeType);
}

export async function deleteListingMedia(listingId: string, mediaId: string) {
  return apiRequest<{ ok: boolean }>(`/listings/${listingId}/media/${mediaId}`, {
    method: 'DELETE',
    authenticated: true,
  });
}

export async function getMyListings() {
  return apiRequest<ListingDTO[]>('/realtor/listings', { authenticated: true });
}

export async function getFavoriteListings() {
  return apiRequest<ListingDTO[]>('/favorites', { authenticated: true });
}

export async function updateListingStatus(listingId: string, status: 'active' | 'rented') {
  return apiRequest<ListingDTO>(`/listings/${listingId}`, {
    method: 'PATCH',
    authenticated: true,
    body: { status },
  });
}

export async function updateListing(
  listingId: string,
  payload: {
    title: string;
    priceMonth: number;
    addressText: string;
    description: string;
    listingPhone: string;
    status: 'active' | 'rented';
  },
) {
  return apiRequest<ListingDTO>(`/listings/${listingId}`, {
    method: 'PATCH',
    authenticated: true,
    body: payload,
  });
}

function mapListingRowToFeedItem(row: ListingDTO): ListingFeedItem {
  const reviews = row.reviewPreviews ?? [];
  const primaryMedia = [...(row.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0];

  return {
    id: row.id,
    title: row.title,
    address: row.addressText,
    priceLabel: formatKztPerMonth(row.priceMonth),
    realtorName: row.realtorName ?? 'Риелтор',
    realtorPhone: row.realtorPhone,
    listingPhone: row.listingPhone,
    description: row.description,
    ratingLabel: formatRating(row.averageRating),
    reviewsCount: row.reviewsCount,
    statusLabel: row.status === 'rented' ? 'Сдано' : 'Не сдано',
    media: [...(row.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    imageUrl:
      primaryMedia?.url ??
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=85',
    reviews: reviews.slice(0, 3).map((review, index) => ({
      id: `${row.id}-${index}`,
      authorName: review.userName ?? 'Пользователь',
      rating: review.rating,
      text: review.text,
    })),
  };
}
