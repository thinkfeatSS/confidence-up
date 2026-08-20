from typing import List, Optional
import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "ConfidenceUp AI Intelligence Engine"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database (MySQL production, SQLite local dev)
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./confidence_ai.db",
        description="Async DB connection string (MySQL or SQLite for local dev)"
    )

    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for async task queue"
    )

    # JWT Authentication (shares secret with NestJS)
    JWT_SECRET: str = Field(
        default="39xDp8E+RbI5839moflWxbwEZbyK0nm4I+XsGQ6Gmn44",
        description="JWT secret key for validating access tokens"
    )
    JWT_ALGORITHM: str = "HS256"

    # Ollama LLM
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    OLLAMA_FALLBACK_MODEL: str = "qwen2.5:3b"

    # Speech-to-Text (Whisper)
    WHISPER_MODEL_SIZE: str = "small"  # 'tiny', 'base', 'small', 'medium', 'large-v3'
    WHISPER_DEVICE: str = "cpu"        # 'cpu' or 'cuda'
    WHISPER_COMPUTE_TYPE: str = "int8" # 'int8', 'float16', 'float32'
    WHISPER_DOWNLOAD_ROOT: Optional[str] = None

    # Storage & Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MAX_AUDIO_SIZE_BYTES: int = 25 * 1024 * 1024  # 25MB
    AUDIO_RETENTION_DAYS: int = 30

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    # Confidence Engine
    CONFIDENCE_ENGINE_VERSION: str = "1.0"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
