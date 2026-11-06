import httpx
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.config import settings
from app.core.logging import logger
from app.core.security import get_current_user, AuthUser

router = APIRouter(prefix="/coach", tags=["AI Speech Coach"])


class CoachMessageDto(BaseModel):
    role: str  # user, assistant, system
    content: str


class CoachContextDto(BaseModel):
    userName: Optional[str] = None
    streak: Optional[int] = None
    confidenceScore: Optional[float] = None
    lastSessionScore: Optional[float] = None


class CoachChatRequest(BaseModel):
    message: Optional[str] = None
    messages: Optional[List[CoachMessageDto]] = None
    context: Optional[CoachContextDto] = None


@router.post("/chat")
async def chat_with_coach(
    payload: CoachChatRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Atlas AI Confidence & Speech Coach conversation endpoint.
    Provides empathetic, personalized vocal, pacing, and confidence coaching.
    """
    user_name = payload.context.userName if payload.context and payload.context.userName else "Speaker"
    streak_val = payload.context.streak if payload.context and payload.context.streak else 0
    score_val = payload.context.confidenceScore if payload.context and payload.context.confidenceScore else 70.0

    raw_messages = payload.messages or []
    if not raw_messages and payload.message:
        raw_messages = [CoachMessageDto(role="user", content=payload.message)]
    elif not raw_messages:
        raw_messages = [CoachMessageDto(role="user", content="Hello Atlas")]

    last_user_message = ""
    conversation_history = []
    for msg in raw_messages:
        conversation_history.append(f"{msg.role.capitalize()}: {msg.content}")
        if msg.role.lower() == "user":
            last_user_message = msg.content

    system_prompt = (
        f"You are Atlas, the inspiring, articulate, and encouraging AI Speech & Confidence Coach at Truefluent AI. "
        f"You are speaking with {user_name}, who currently has a {streak_val}-day practice streak and an overall "
        f"confidence score of {score_val}%. "
        f"Your goal is to give practical, uplifting, actionable advice on public speaking, English fluency, "
        f"reducing filler words, diaphragmatic breathing, pacing (120-150 WPM), and vocal variety. "
        f"Keep responses concise (2 to 4 sentences), direct, and motivational."
    )

    # Attempt LLM inference via Ollama
    reply = None
    try:
        ollama_url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        full_prompt = f"{system_prompt}\n\nRecent conversation:\n" + "\n".join(conversation_history) + "\nAtlas:"
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                ollama_url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": full_prompt,
                    "stream": False,
                    "keep_alive": "5m",
                    "options": {
                        "temperature": 0.4,
                        "top_p": 0.9,
                        "num_ctx": 2048,
                        "num_predict": 300,
                        "num_thread": 2,
                    },
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                reply = data.get("response", "").strip()
    except Exception as ex:
        logger.warning(f"Ollama coach generation fallback: {ex}")

    # Fallback response generator if Ollama is offline
    if not reply:
        lower_msg = last_user_message.lower()
        if "nervous" in lower_msg or "anxiety" in lower_msg or "scared" in lower_msg or "fear" in lower_msg:
            reply = (
                f"It is completely normal to feel that rush of adrenaline before speaking, {user_name}. "
                f"Try a 4-7-8 breathing cycle: inhale for 4 seconds, hold for 7, exhale slowly for 8. "
                f"Remember, physical symptoms of nerves are identical to excitement—reframe your nervous energy into vocal passion!"
            )
        elif "filler" in lower_msg or "um" in lower_msg or "like" in lower_msg:
            reply = (
                "Fillers happen when our mouth moves faster than our thoughts. Whenever you feel an 'um' coming on, "
                "simply close your lips and take a silent 1-second pause. A silent pause sounds confident and gives your listener time to absorb your words."
            )
        elif "pace" in lower_msg or "fast" in lower_msg or "speed" in lower_msg:
            reply = (
                "The sweet spot for persuasive clarity is 130 to 150 words per minute. "
                "Practice reading a paragraph out loud while tapping your foot to a steady beat to train natural cadence."
            )
        elif "streak" in lower_msg or "habit" in lower_msg or "daily" in lower_msg:
            reply = (
                f"You're already on a {streak_val}-day streak! Consistency compounds faster than intensity. "
                f"Even 2 minutes of daily speech practice will transform your natural fluency over 30 days."
            )
        else:
            reply = (
                f"Keep up the great momentum, {user_name}! Focus on taking a full diaphragmatic breath before your next sentence, "
                f"and emphasize your key action verbs. How does your voice feel today?"
            )

    return {
        "success": True,
        "data": {
            "reply": reply,
        }
    }
