import asyncio
import json
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger

_redis_client = None
_in_memory_queue: asyncio.Queue = asyncio.Queue()


async def get_redis_client():
    global _redis_client
    if _redis_client is None:
        try:
            import redis.asyncio as redis
            client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            await client.ping()
            _redis_client = client
            logger.info("Connected to Redis queue successfully.")
        except Exception as e:
            logger.warning(f"Redis unavailable ({str(e)}). Using in-memory task queue.")
            _redis_client = None
    return _redis_client


async def enqueue_task(queue_name: str, payload: Dict[str, Any]):
    """Pushes a task payload to the Redis queue or in-memory queue."""
    client = await get_redis_client()
    if client:
        try:
            await client.rpush(queue_name, json.dumps(payload))
            return
        except Exception as e:
            logger.warning(f"Failed to enqueue to Redis: {str(e)}. Falling back to in-memory queue.")
            
    await _in_memory_queue.put((queue_name, payload))


async def dequeue_task(queue_name: str, timeout: int = 2) -> Optional[Dict[str, Any]]:
    """Pulls a task payload from the queue."""
    client = await get_redis_client()
    if client:
        try:
            item = await client.blpop(queue_name, timeout=timeout)
            if item:
                return json.loads(item[1])
        except Exception:
            pass
            
    # In-memory queue check
    try:
        if not _in_memory_queue.empty():
            q_name, payload = await asyncio.wait_for(_in_memory_queue.get(), timeout=0.1)
            if q_name == queue_name:
                return payload
            else:
                # Put back if different queue
                await _in_memory_queue.put((q_name, payload))
    except Exception:
        pass
    return None
