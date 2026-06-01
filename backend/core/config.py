"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "RoadWatch"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql://roadwatch:roadwatch123@localhost:5432/roadwatch"
    REDIS_URL: str = ""  # optional — app works without Redis

    # AI / LLM
    OPENAI_API_KEY: str = ""          # optional — only needed if using OpenAI embeddings
    GROQ_API_KEY: str = ""            # free at console.groq.com
    OPENAI_MODEL: str = "gpt-4o"      # ignored when using Groq
    GROQ_MODEL: str = "llama-3.3-70b-versatile"  # current Groq model (llama3-70b-8192 decommissioned)
    EMBEDDING_MODEL: str = "text-embedding-3-small"  # OpenAI embeddings (or swap below)

    # Maps — using OpenStreetMap (free, no key needed)
    # MAPBOX_TOKEN removed — replaced with Leaflet + OSM

    # ChromaDB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION: str = "roadwatch_docs"

    # CORS — allow all Render subdomains and localhost
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
    ALLOWED_ORIGIN_REGEX: str = r"https://.*\.onrender\.com"
    FRONTEND_URL: str = ""

    # Admin
    ADMIN_KEY: str = "roadwatch-admin-2026"  # Change this in production!
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads"

    # Notifications (optional)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    SENDGRID_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
