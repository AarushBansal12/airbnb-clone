"""FastAPI application entrypoint."""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import bookings, host, listings, misc
from .seed import init_db

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables and seed on first boot (free hosting tiers often wipe the disk on redeploy)
    init_db()
    yield


app = FastAPI(title="Airbnb Clone API", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(host.router)
app.include_router(misc.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
