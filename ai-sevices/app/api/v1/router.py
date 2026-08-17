from fastapi import APIRouter
from app.api.v1.endpoints import sessions, health, benchmark, progress

api_router = APIRouter()

api_router.include_router(sessions.router, tags=["Speech Sessions"])
api_router.include_router(progress.router, tags=["Progress Tracking"])
api_router.include_router(benchmark.router, tags=["Benchmarking"])
api_router.include_router(health.router, tags=["System Health"])
