"""
Caching Module - Redis and in-memory caching
"""

import json
import pickle
from typing import Any, Optional, Union
from functools import wraps
import asyncio
from datetime import timedelta

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


class CacheService:
    """Cache service with Redis and fallback to in-memory"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.memory_cache: dict = {}
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection"""
        if REDIS_AVAILABLE and settings.REDIS_URL and settings.CACHE_ENABLED:
            try:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=False
                )
                logger.info("Redis cache initialized")
            except Exception as e:
                logger.warning(f"Redis initialization failed: {e}. Using memory cache.")
                self.redis_client = None
        else:
            logger.info("Using in-memory cache")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if self.redis_client:
                value = await self.redis_client.get(key)
                if value:
                    return pickle.loads(value)
            else:
                return self.memory_cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
        return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache with optional TTL"""
        try:
            ttl = ttl or settings.CACHE_TTL
            
            if self.redis_client:
                serialized = pickle.dumps(value)
                await self.redis_client.setex(
                    key,
                    timedelta(seconds=ttl),
                    serialized
                )
            else:
                self.memory_cache[key] = value
                # Memory cache cleanup (simple approach)
                if len(self.memory_cache) > 1000:
                    # Remove oldest 100 items
                    for _ in range(100):
                        self.memory_cache.pop(next(iter(self.memory_cache)))
            
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if self.redis_client:
                await self.redis_client.delete(key)
            else:
                self.memory_cache.pop(key, None)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def clear(self) -> bool:
        """Clear all cache"""
        try:
            if self.redis_client:
                await self.redis_client.flushdb()
            else:
                self.memory_cache.clear()
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            if self.redis_client:
                return await self.redis_client.exists(key) > 0
            else:
                return key in self.memory_cache
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False
    
    async def get_many(self, keys: list[str]) -> dict[str, Any]:
        """Get multiple values from cache"""
        result = {}
        for key in keys:
            value = await self.get(key)
            if value is not None:
                result[key] = value
        return result
    
    async def set_many(
        self,
        data: dict[str, Any],
        ttl: Optional[int] = None
    ) -> bool:
        """Set multiple values in cache"""
        try:
            for key, value in data.items():
                await self.set(key, value, ttl)
            return True
        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
            return False


# Global cache instance
cache_service = CacheService()


def cached(
    ttl: int = 3600,
    key_prefix: str = "",
    key_builder: Optional[callable] = None
):
    """
    Decorator for caching function results
    
    Usage:
        @cached(ttl=3600, key_prefix="user")
        async def get_user(user_id: str):
            return fetch_user(user_id)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default key builder
                key_parts = [key_prefix or func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_value = await cache_service.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value
            
            # Execute function
            logger.debug(f"Cache miss: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Store in cache
            await cache_service.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


def cache_key(*parts) -> str:
    """Build cache key from parts"""
    return ":".join(str(part) for part in parts)
