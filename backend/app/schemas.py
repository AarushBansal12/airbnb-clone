"""Pydantic request/response models — the API contract."""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- users ----------
class UserOut(ORM):
    id: int
    name: str
    email: str
    avatar_url: str | None
    is_host: bool
    is_superhost: bool


class HostOut(ORM):
    id: int
    name: str
    avatar_url: str | None
    bio: str | None
    is_superhost: bool
    created_at: datetime
    listing_count: int = 0
    review_count: int = 0
    rating: float | None = None


# ---------- amenities ----------
class AmenityOut(ORM):
    id: int
    name: str
    icon: str


# ---------- listings ----------
class ListingCard(BaseModel):
    """Compact shape used by the explore grid, wishlists and trips."""

    id: int
    title: str
    city: str
    state: str | None
    country: str
    property_type: str
    category: str
    price_per_night: int
    rating: float | None
    review_count: int
    photos: list[str]
    latitude: float
    longitude: float
    bedrooms: int
    beds: int
    max_guests: int
    host_name: str
    host_is_superhost: bool


class DateRange(BaseModel):
    check_in: date
    check_out: date


class ListingDetail(ListingCard):
    description: str
    cleaning_fee: int
    bathrooms: int
    amenities: list[AmenityOut]
    host: HostOut
    booked_ranges: list[DateRange]
    created_at: datetime


class ListingPage(BaseModel):
    items: list[ListingCard]
    total: int
    page: int
    page_size: int
    has_more: bool


class ListingIn(BaseModel):
    """Create/update payload sent by the host form."""

    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20)
    property_type: str
    category: str
    city: str = Field(min_length=1)
    state: str | None = None
    country: str = Field(min_length=1)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    price_per_night: int = Field(gt=0, le=1_000_000)
    cleaning_fee: int = Field(ge=0, default=0)
    max_guests: int = Field(gt=0, le=50)
    bedrooms: int = Field(ge=0, le=50)
    beds: int = Field(ge=1, le=100)
    bathrooms: int = Field(ge=1, le=50)
    amenity_ids: list[int] = []
    photo_urls: list[str] = Field(min_length=1, max_length=20)

    @field_validator("photo_urls")
    @classmethod
    def _valid_urls(cls, urls: list[str]) -> list[str]:
        cleaned = [u.strip() for u in urls if u.strip()]
        for u in cleaned:
            if not (u.startswith("/") or u.startswith("http")):
                HttpUrl(u)  # raises a readable validation error
        if not cleaned:
            raise ValueError("At least one photo is required")
        return cleaned


class HostListingOut(ListingCard):
    upcoming_bookings: int
    total_earnings: int


# ---------- pricing ----------
class Quote(BaseModel):
    available: bool
    nightly_rate: int
    nights: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    taxes: int
    total: int


# ---------- bookings ----------
class BookingIn(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(gt=0)

    @model_validator(mode="after")
    def _dates_in_order(self):
        if self.check_out <= self.check_in:
            raise ValueError("Check-out must be after check-in")
        if self.check_in < date.today():
            raise ValueError("Check-in can't be in the past")
        if (self.check_out - self.check_in).days > 90:
            raise ValueError("Stays are limited to 90 nights")
        return self


class BookingOut(BaseModel):
    id: int
    listing: ListingCard
    guest: UserOut
    check_in: date
    check_out: date
    guests: int
    nightly_rate: int
    nights: int
    cleaning_fee: int
    service_fee: int
    taxes: int
    total_price: int
    status: str
    created_at: datetime
    has_review: bool


# ---------- reviews ----------
class ReviewOut(ORM):
    id: int
    rating: int
    comment: str
    created_at: datetime
    author: UserOut


class ReviewIn(BaseModel):
    booking_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=5, max_length=2000)
