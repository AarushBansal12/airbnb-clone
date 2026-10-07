import type {
  Amenity,
  Booking,
  Category,
  HostListing,
  ListingDetail,
  ListingInput,
  ListingPage,
  PriceStats,
  Quote,
  Review,
  User,
  ListingCard,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

const USER_KEY = "airbnb-clone:user-id";

/** Mocked auth: the active account id lives in localStorage and is sent as X-User-Id. */
export function getStoredUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(USER_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export function setStoredUserId(id: number) {
  try {
    window.localStorage.setItem(USER_KEY, String(id));
  } catch {
    /* private mode: fall back to in-memory default */
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const uid = getStoredUserId();
  if (uid) headers.set("X-User-Id", String(uid));
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail) && body.detail[0]?.msg)
        message = String(body.detail[0].msg).replace(/^Value error, /, "");
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== false) sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const api = {
  // users
  users: () => request<User[]>("/api/users"),

  // metadata
  amenities: () => request<Amenity[]>("/api/amenities"),
  categories: () => request<Category[]>("/api/categories"),
  propertyTypes: () => request<string[]>("/api/property-types"),
  priceStats: () => request<PriceStats>("/api/listings/price-stats"),

  // listings
  searchListings: (params: Record<string, string | number | boolean | undefined>) =>
    request<ListingPage>(`/api/listings${qs(params)}`),
  listing: (id: number) => request<ListingDetail>(`/api/listings/${id}`),
  quote: (id: number, check_in: string, check_out: string, guests: number) =>
    request<Quote>(`/api/listings/${id}/quote${qs({ check_in, check_out, guests })}`),
  reviews: (id: number) => request<Review[]>(`/api/listings/${id}/reviews`),
  createReview: (listingId: number, body: { booking_id: number; rating: number; comment: string }) =>
    request<Review>(`/api/listings/${listingId}/reviews`, { method: "POST", body: JSON.stringify(body) }),

  // host
  createListing: (body: ListingInput) =>
    request<ListingDetail>("/api/listings", { method: "POST", body: JSON.stringify(body) }),
  updateListing: (id: number, body: ListingInput) =>
    request<ListingDetail>(`/api/listings/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteListing: (id: number) => request<void>(`/api/listings/${id}`, { method: "DELETE" }),
  hostListings: () => request<HostListing[]>("/api/host/listings"),
  hostBookings: () => request<Booking[]>("/api/host/bookings"),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string }>("/api/uploads", { method: "POST", body: fd });
  },

  // bookings
  createBooking: (body: { listing_id: number; check_in: string; check_out: string; guests: number }) =>
    request<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(body) }),
  myTrips: () => request<Booking[]>("/api/bookings/me"),
  cancelBooking: (id: number) => request<Booking>(`/api/bookings/${id}/cancel`, { method: "POST" }),

  // wishlists
  wishlist: () => request<ListingCard[]>("/api/wishlists"),
  wishlistIds: () => request<number[]>("/api/wishlists/ids"),
  addToWishlist: (id: number) => request<void>(`/api/wishlists/${id}`, { method: "PUT" }),
  removeFromWishlist: (id: number) => request<void>(`/api/wishlists/${id}`, { method: "DELETE" }),
};
