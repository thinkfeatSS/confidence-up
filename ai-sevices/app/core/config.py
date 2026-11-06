from typing import List, Optional
import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "Truefluent AI Unified Engine"
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

    # JWT Authentication
    JWT_SECRET: str = Field(
        default="39xDp8E+RbI5839moflWxbwEZbyK0nm4I+XsGQ6Gmn44",
        description="JWT secret key for validating access tokens"
    )
    JWT_REFRESH_SECRET: str = Field(
        default="A5fvnDAZxMiuFuVBFvMdUKZsCPHkVZiC9jid8lMfcG88",
        description="JWT refresh secret key"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRES_MINUTES: int = 15
    JWT_REFRESH_EXPIRES_DAYS: int = 7

    # Email / SMTP Settings (Hostinger testitan.com)
    MAIL_HOST: str = "smtp.hostinger.com"
    MAIL_PORT: int = 465
    MAIL_SECURE: bool = True
    MAIL_USER: str = "info@testitan.com"
    MAIL_PASSWORD: str = "Mastsanai110#"
    MAIL_FROM_NAME: str = "Truefluent AI"
    MAIL_FROM_ADDRESS: str = "info@testitan.com"

    # Application URLs
    APP_URL: str = "https://speakupmic.binaryunit.tech"
    FRONTEND_URL: str = "https://speakupmic.vercel.app"

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

    # Core NestJS API Inter-Service Bridge
    CORE_API_URL: str = Field(
        default="http://localhost:3000",
        description="Base URL of core NestJS API for inter-service sync"
    )
    INTERNAL_SERVICE_SECRET: str = Field(
        default="",
        description="Shared secret for internal service-to-service communication"
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
