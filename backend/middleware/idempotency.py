"""
Idempotency Middleware for protected POST requests
"""
import json
import hashlib
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from redis.asyncio import Redis
from config.settings import settings

class IdempotencyMiddleware(BaseHTTPMiddleware):
    """
    Ensures that identical POST requests are not processed multiple times.
    Uses X-Idempotency-Key header.
    """
    
    def __init__(self, app, redis_url: str):
        super().__init__(app)
        self.redis = Redis.from_url(redis_url, decode_responses=True)

    async def dispatch(self, request: Request, call_next):
        if request.method != "POST" or "/api/v1/orders" not in request.url.path:
            return await call_next(request)

        idempotency_key = request.headers.get("X-Idempotency-Key")
        if not idempotency_key:
            return await call_next(request)

        # Generate a unique key for this request
        # We include user_id if available to prevent key collisions between users
        user_id = "anon"
        if hasattr(request.state, "user"):
             user_id = getattr(request.state.user, "id", "anon")
        
        storage_key = f"idempotency:{user_id}:{idempotency_key}"

        # 1. Check if key exists
        existing_resp = await self.redis.get(storage_key)
        if existing_resp:
            resp_data = json.loads(existing_resp)
            return Response(
                content=resp_data["body"],
                status_code=resp_data["status_code"],
                headers=resp_data["headers"]
            )

        # 2. Lock the key to prevent concurrent identical requests
        # Using a simple SET NX with TTL
        lock_key = f"lock:{storage_key}"
        if not await self.redis.set(lock_key, "1", ex=10, nx=True):
            return Response(
                content=json.dumps({"detail": "Yêu cầu đang được xử lý, vui lòng đợi."}),
                status_code=409,
                headers={"Content-Type": "application/json"}
            )

        try:
            response = await call_next(request)
            
            # 3. Only cache successful or client-error responses
            if response.status_code < 500:
                # We need to read the body to cache it
                body = b""
                async for chunk in response.body_iterator:
                    body += chunk
                
                # Reconstruct response for caller
                new_response = Response(
                    content=body,
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
                
                # Save to redis
                await self.redis.set(
                    storage_key,
                    json.dumps({
                        "body": body.decode("utf-8") if body else "",
                        "status_code": response.status_code,
                        "headers": dict(response.headers)
                    }),
                    ex=3600 # 1 hour TTL
                )
                
                return new_response
            
            return response
        finally:
            await self.redis.delete(lock_key)
