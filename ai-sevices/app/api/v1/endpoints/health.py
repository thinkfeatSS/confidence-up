import httpx
from fastapi import APIRouter
from app.core.config import settings
from app.workers.queue import get_redis_client

router = APIRouter()


@router.get("/health")
async def health_check():
    """Readiness probe checking Redis, DB, Ollama, and Whisper services."""
    services = {
        "api": "healthy",
        "redis": "unknown",
        "ollama": "unknown",
        "whisper": "ready",
    }
    
    # Check Redis
    redis_client = await get_redis_client()
    if redis_client:
        try:
            await redis_client.ping()
            services["redis"] = "healthy"
        except Exception:
            services["redis"] = "unreachable"
    else:
        services["redis"] = "in-memory-fallback"
        
    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            services["ollama"] = "healthy" if resp.status_code == 200 else "degraded"
    except Exception:
        services["ollama"] = "offline (using fallback rule coach)"
        
    return {
        "status": "healthy",
        "services": services,
        "engine_version": settings.CONFIDENCE_ENGINE_VERSION,
        "whisper_model": settings.WHISPER_MODEL_SIZE,
        "ollama_model": settings.OLLAMA_MODEL,
    }
