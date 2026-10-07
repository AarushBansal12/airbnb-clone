"""Date-availability rules shared by search, quotes and booking creation.

Dates are half-open ranges [check_in, check_out): the check-out day is free for the
next guest to check in, exactly like Airbnb's same-day turnover.
Two ranges overlap  <=>  a.start < b.end AND b.start < a.end
"""
from datetime import date

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from ..models import Booking

ACTIVE_STATUS = "confirmed"


def overlapping_bookings_clause(check_in: date, check_out: date):
    """SQL condition matching active bookings that overlap [check_in, check_out)."""
    return and_(
        Booking.status == ACTIVE_STATUS,
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )


def is_available(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    stmt = (
        select(Booking.id)
        .where(Booking.listing_id == listing_id, overlapping_bookings_clause(check_in, check_out))
        .limit(1)
    )
    return db.scalar(stmt) is None


def booked_ranges(db: Session, listing_id: int, from_date: date) -> list[tuple[date, date]]:
    """Active bookings ending after `from_date`, used to grey out calendar days."""
    stmt = (
        select(Booking.check_in, Booking.check_out)
        .where(
            Booking.listing_id == listing_id,
            Booking.status == ACTIVE_STATUS,
            Booking.check_out > from_date,
        )
        .order_by(Booking.check_in)
    )
    return [(row.check_in, row.check_out) for row in db.execute(stmt)]
