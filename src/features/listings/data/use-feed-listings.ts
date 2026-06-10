import { useQuery } from '@tanstack/react-query';
import { getFeedListings } from './listing-repository';
import { mockListings } from './mock-listings';

export function useFeedListings() {
  return useQuery({
    queryKey: ['feed-listings'],
    queryFn: getFeedListings,
    placeholderData: mockListings,
    select: (listings) => (listings.length > 0 ? listings : mockListings),
  });
}
