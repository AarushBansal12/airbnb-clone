// Mirrors backend/app/schemas.py

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  is_host: boolean;
  is_superhost: boolean;
}

export interface Host {
  id: number;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  is_superhost: boolean;
  created_at: string;
  listing_count: number;
  review_count: number;
  rating: number | null;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
}

export interface ListingCard {
  id: number;
  title: string;
  city: string;
  state: string | null;
  country: string;
  property_type: string;
  category: string;
  price_per_night: number;
  rating: number | null;
  review_count: number;
  photos: string[];
  latitude: number;
  longitude: number;
  bedrooms: number;
  beds: number;
  max_guests: number;
  host_name: string;
  host_is_superhost: boolean;
}

export interface DateRange {
  check_in: string; // YYYY-MM-DD
  check_out: string; // exclusive
}

export interface ListingDetail extends ListingCard {
  description: string;
  cleaning_fee: number;
  bathrooms: number;
  amenities: Amenity[];
  host: Host;
  booked_ranges: DateRange[];
  created_at: string;
}

export interface ListingPage {
  items: ListingCard[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface HostListing extends ListingCard {
  upcoming_bookings: number;
  total_earnings: number;
}

export interface Quote {
  available: boolean;
  nightly_rate: number;
  nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total: number;
}

export interface Booking {
  id: number;
  listing: ListingCard;
  guest: User;
  check_in: string;
  check_out: string;
  guests: number;
  nightly_rate: number;
  nights: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total_price: number;
  status: "confirmed" | "cancelled";
  created_at: string;
  has_review: boolean;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: User;
}

export interface Category {
  name: string;
  count: number;
}

export interface PriceStats {
  min: number;
  max: number;
  histogram: number[];
}

export interface ListingInput {
  title: string;
  description: string;
  property_type: string;
  category: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenity_ids: number[];
  photo_urls: string[];
}
