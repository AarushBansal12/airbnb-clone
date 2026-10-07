"""API tests for the booking rules. Run from backend/:  pytest -q"""
import os
from datetime import date, timedelta

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.seed import init_db

GUEST = {"X-User-Id": "6"}  # Aarav (seeded guest)
HOST = {"X-User-Id": "1"}  # Priya (seeded host)


@pytest.fixture(scope="module")
def client():
    init_db(reset=True)
    with TestClient(app) as c:
        yield c
    os.remove("test.db")


def far(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def book(client, check_in, check_out, listing_id=2, headers=GUEST):
    return client.post(
        "/api/bookings",
        json={"listing_id": listing_id, "check_in": check_in, "check_out": check_out, "guests": 1},
        headers=headers,
    )


def test_booking_blocks_overlapping_dates(client):
    assert book(client, far(200), far(203)).status_code == 201
    # overlaps the last night
    assert book(client, far(202), far(205)).status_code == 409
    # fully inside
    assert book(client, far(201), far(202)).status_code == 409


def test_same_day_turnover_is_allowed(client):
    # previous stay checks out on far(203); a new stay may check in that day
    assert book(client, far(203), far(205)).status_code == 201


def test_invalid_ranges_rejected(client):
    assert book(client, far(10), far(10)).status_code == 422  # zero nights
    assert book(client, far(-5), far(-2)).status_code == 422  # in the past


def test_search_excludes_unavailable_listings(client):
    res = client.get(f"/api/listings?check_in={far(200)}&check_out={far(203)}&page_size=50").json()
    assert 2 not in [item["id"] for item in res["items"]]


def test_cancel_frees_dates(client):
    b = book(client, far(300), far(302)).json()
    assert client.post(f"/api/bookings/{b['id']}/cancel", headers=GUEST).status_code == 200
    assert book(client, far(300), far(302)).status_code == 201


def test_host_cannot_book_own_listing(client):
    own = client.get("/api/host/listings", headers=HOST).json()[0]["id"]
    assert book(client, far(400), far(401), listing_id=own, headers=HOST).status_code == 400


def test_guest_cannot_create_listing(client):
    assert client.post("/api/listings", json={}, headers=GUEST).status_code == 403


def test_quote_matches_booking_total(client):
    q = client.get(f"/api/listings/3/quote?check_in={far(500)}&check_out={far(504)}&guests=2").json()
    b = book(client, far(500), far(504), listing_id=3).json()
    assert q["total"] == b["total_price"] and q["nights"] == 4
