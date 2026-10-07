"""Host dashboard: owned listings with stats, and reservations on them."""
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from .. import schemas
from ..database import get_db
from ..deps import get_current_host
from ..models import Booking, Listing, User
from ..serializers import bookings_out, listing_card, rating_stats
from .bookings import BOOKING_LOAD

router = APIRouter(prefix="/api/host", tags=["host"])


@router.get("/listings", response_model=list[schemas.HostListingOut])
def my_listings(db: Session = Depends(get_db), host: User = Depends(get_current_host)):
    listings = db.scalars(
        select(Listing)
        .where(Listing.host_id == host.id)
        .options(selectinload(Listing.photos), joinedload(Listing.host))
        .order_by(Listing.created_at.desc())
    ).unique().all()
    ids = [l.id for l in listings]
    stats = rating_stats(db, ids)

    today = date.today()
    agg = {
        row.listing_id: row
        for row in db.execute(
            select(
                Booking.listing_id,
                func.sum(case((Booking.check_out > today, 1), else_=0)).label("upcoming"),
                # host payout = what the guest paid minus platform service fee and taxes
                func.sum(Booking.total_price - Booking.service_fee - Booking.taxes).label("earnings"),
            )
            .where(Booking.listing_id.in_(ids), Booking.status == "confirmed")
            .group_by(Booking.listing_id)
        )
    }
    out = []
    for l in listings:
        row = agg.get(l.id)
        out.append(
            schemas.HostListingOut(
                **listing_card(l, stats).model_dump(),
                upcoming_bookings=int(row.upcoming or 0) if row else 0,
                total_earnings=int(row.earnings or 0) if row else 0,
            )
        )
    return out


@router.get("/bookings", response_model=list[schemas.BookingOut])
def reservations(db: Session = Depends(get_db), host: User = Depends(get_current_host)):
    bookings = db.scalars(
        select(Booking)
        .join(Listing, Booking.listing_id == Listing.id)
        .where(Listing.host_id == host.id)
        .options(*BOOKING_LOAD)
        .order_by(Booking.check_in.desc())
    ).unique().all()
    return bookings_out(db, list(bookings))
