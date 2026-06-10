export type UserRole = 'client' | 'realtor';
export type ListingStatus = 'active' | 'rented' | 'archived';
export type MediaType = 'photo' | 'video';

export type Profile = {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string | null;
  isAdmin: boolean;
  createdAt: string;
};

export type Listing = {
  id: string;
  realtor_id: string;
  title: string;
  price_month: number;
  address_text: string;
  description: string | null;
  realtor_phone: string | null;
  listing_phone: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
};

export type ListingMedia = {
  id: string;
  listing_id: string;
  url: string;
  type: MediaType;
  sort_order: number;
};

export type Review = {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  text: string;
  created_at: string;
};
