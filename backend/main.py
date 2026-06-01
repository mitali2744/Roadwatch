"""
RoadWatch Backend — FastAPI Application Entry Point
AI-powered road transparency platform for Road Safety Hackathon 2026
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from api.routes import roads, complaints, chatbot, dashboard, auth, voice, predictions, public_feed
from db.database import init_db
from services.rag.vector_store import init_vector_store
from core.config import settings
from loguru import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 Starting RoadWatch API...")
    await init_db()
    await init_vector_store()
    # Auto-seed if database is empty
    await auto_seed()
    logger.info("✅ RoadWatch API ready")
    yield
    logger.info("🛑 Shutting down RoadWatch API...")


async def auto_seed():
    """Seed sample data automatically if the database is empty."""
    try:
        from db.database import AsyncSessionLocal
        from db.models import Contractor
        from sqlalchemy import select, func
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(func.count()).select_from(Contractor))
            count = result.scalar()
            if count == 0:
                logger.info("📦 Database empty — running auto-seed...")
                from db.seed_data import seed
                await seed()
                logger.info("✅ Auto-seed complete")
            else:
                logger.info(f"✅ Database has {count} contractors — skipping seed")
    except Exception as e:
        logger.warning(f"⚠️ Auto-seed failed (non-critical): {e}")


app = FastAPI(
    title="RoadWatch API",
    description="AI-powered road transparency platform — Road Safety Hackathon 2026",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── Middleware ────────────────────────────────────────────────────────────────
allowed_origins = list(settings.ALLOWED_ORIGINS)
if settings.FRONTEND_URL:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",        tags=["Auth"])
app.include_router(roads.router,       prefix="/api/roads",       tags=["Roads"])
app.include_router(complaints.router,  prefix="/api/complaints",  tags=["Complaints"])
app.include_router(chatbot.router,     prefix="/api/chatbot",     tags=["AI Chatbot"])
app.include_router(dashboard.router,   prefix="/api/dashboard",   tags=["Dashboard"])
app.include_router(voice.router,       prefix="/api/voice",       tags=["Voice"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["ML Predictions"])
app.include_router(public_feed.router,  prefix="/api/feed",        tags=["Public Feed"])

# Static files (uploaded images)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "RoadWatch API",
        "version": "1.0.0",
    }
