"""
Server-Sent Events (SSE) for real-time UI updates
"""
import asyncio
import json
from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from redis.asyncio import Redis
from config.settings import settings
from api.v1.auth.dependencies import get_current_user, CurrentUser

router = APIRouter()

async def get_redis():
    """Get async redis client"""
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        yield redis
    finally:
        await redis.close()

@router.get("/stream")
async def stream_events(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    redis: Redis = Depends(get_redis)
):
    """
    Stream real-time events for the current owner.
    Clients (Web/Mobile) connect to this to receive "no refresh" updates.
    """
    owner_id = current_user.owner_id
    if not owner_id:
        return {"error": "User not associated with an owner"}

    channel = f"owner_{owner_id}"
    
    async def event_generator():
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel)
        
        try:
            while True:
                # Check for client disconnect
                if await request.is_disconnected():
                    break
                
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    yield {
                        "event": "update",
                        "data": message["data"]
                    }
                else:
                    # Keep-alive
                    yield {
                        "event": "ping",
                        "data": "keep-alive"
                    }
                
                await asyncio.sleep(0.1)
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()

    return EventSourceResponse(event_generator())

async def publish_event(owner_id: int, event_type: str, data: dict):
    """
    Helper to publish an event to a specific owner's stream.
    """
    redis = Redis.from_url(settings.redis_url)
    try:
        channel = f"owner_{owner_id}"
        message = json.dumps({
            "type": event_type,
            "payload": data
        })
        await redis.publish(channel, message)
    finally:
        await redis.close()
