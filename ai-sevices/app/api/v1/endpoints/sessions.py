"""
Backward compatibility proxy for speech session routes.
Delegates to unified speech.py module.
"""
from app.api.v1.endpoints.speech import (
    router,
    upload_speech_audio,
    get_practice_session_status as get_session_status,
    get_retry_comparison,
)

__all__ = ["router", "upload_speech_audio", "get_session_status", "get_retry_comparison"]
