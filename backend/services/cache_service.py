"""
Cache Service - Advanced caching system for JurisAI platform
"""

import asyncio
import logging
import json
import hashlib
import pickle
from typing import Dict, List, Any, Optional, Union, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import threading
import time
from collections import OrderedDict

from core.logging import get_logger, performance_logger
from core.error_handling import handle_errors, JurisAIException

logger = get_logger(__name__)

class CacheType(Enum):
    """Cache types"""
    MEMORY = "memory"
    REDIS = "redis"
    FILE = "file"
    DATABASE = "database"

class CachePolicy(Enum):
    """Cache eviction policies"""
    LRU = "lru"  # Least Recently Used
    LFU = "lfu"  # Least Frequently Used
    FIFO = "fifo"  # First In First Out
    TTL = "ttl"  # Time To Live

@dataclass
class CacheEntry:
    """Cache entry structure"""
    key: str
    value: Any
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    access_count: int = 0
    ttl: Optional[timedelta] = None
    size_bytes: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class CacheStats:
    """Cache statistics"""
    total_entries: int = 0
    total_size_bytes: int = 0
    hit_count: int = 0
    miss_count: int = 0
    eviction_count: int = 0
    avg_access_time: float = 0.0
    oldest_entry: Optional[datetime] = None
    newest_entry: Optional[datetime] = None

class MemoryCache:
    """In-memory cache implementation with LRU eviction"""
    
    def __init__(self, max_size: int = 1000, max_memory_mb: int = 100):
        self.max_size = max_size
        self.max_memory_bytes = max_memory_mb * 1024 * 1024
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.lock = threading.RLock()
        self.stats = CacheStats()
        
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        start_time = time.time()
        
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                
                # Check TTL
                if entry.ttl and (datetime.utcnow() - entry.created_at) > entry.ttl:
                    del self.cache[key]
                    self.stats.miss_count += 1
                    return None
                
                # Update access info
                entry.last_accessed = datetime.utcnow()
                entry.access_count += 1
                
                # Move to end (LRU)
                self.cache.move_to_end(key)
                
                self.stats.hit_count += 1
                self._update_access_time(start_time)
                
                return entry.value
            else:
                self.stats.miss_count += 1
                self._update_access_time(start_time)
                return None
    
    def set(self, key: str, value: Any, ttl: Optional[timedelta] = None, metadata: Optional[Dict[str, Any]] = None):
        """Set value in cache"""
        with self.lock:
            # Calculate size
            try:
                size_bytes = len(pickle.dumps(value))
            except:
                size_bytes = len(str(value).encode('utf-8'))
            
            # Check memory limit
            if size_bytes > self.max_memory_bytes:
                raise JurisAIException(
                    "Value too large for cache",
                    error_code="CACHE_VALUE_TOO_LARGE"
                )
            
            # Evict if necessary
            while (len(self.cache) >= self.max_size or 
                   self._get_total_size() + size_bytes > self.max_memory_bytes):
                if not self._evict_lru():
                    break
            
            # Create entry
            entry = CacheEntry(
                key=key,
                value=value,
                ttl=ttl,
                size_bytes=size_bytes,
                metadata=metadata or {}
            )
            
            self.cache[key] = entry
            self._update_stats()
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                self._update_stats()
                return True
            return False
    
    def clear(self):
        """Clear all cache entries"""
        with self.lock:
            self.cache.clear()
            self.stats = CacheStats()
    
    def _evict_lru(self) -> bool:
        """Evict least recently used entry"""
        if not self.cache:
            return False
        
        # Get oldest key (first in OrderedDict)
        oldest_key = next(iter(self.cache))
        del self.cache[oldest_key]
        self.stats.eviction_count += 1
        return True
    
    def _get_total_size(self) -> int:
        """Get total cache size in bytes"""
        return sum(entry.size_bytes for entry in self.cache.values())
    
    def _update_stats(self):
        """Update cache statistics"""
        self.stats.total_entries = len(self.cache)
        self.stats.total_size_bytes = self._get_total_size()
        
        if self.cache:
            entries = list(self.cache.values())
            self.stats.oldest_entry = min(entry.created_at for entry in entries)
            self.stats.newest_entry = max(entry.created_at for entry in entries)
        else:
            self.stats.oldest_entry = None
            self.stats.newest_entry = None
    
    def _update_access_time(self, start_time: float):
        """Update average access time"""
        access_time = time.time() - start_time
        total_accesses = self.stats.hit_count + self.stats.miss_count
        
        if total_accesses == 1:
            self.stats.avg_access_time = access_time
        else:
            self.stats.avg_access_time = (
                (self.stats.avg_access_time * (total_accesses - 1) + access_time) / total_accesses
            )
    
    def get_stats(self) -> CacheStats:
        """Get cache statistics"""
        with self.lock:
            self._update_stats()
            return self.stats
    
    def get_keys(self) -> List[str]:
        """Get all cache keys"""
        with self.lock:
            return list(self.cache.keys())
    
    def get_entry_info(self, key: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a cache entry"""
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                return {
                    "key": entry.key,
                    "size_bytes": entry.size_bytes,
                    "created_at": entry.created_at.isoformat(),
                    "last_accessed": entry.last_accessed.isoformat(),
                    "access_count": entry.access_count,
                    "ttl": entry.ttl.total_seconds() if entry.ttl else None,
                    "metadata": entry.metadata
                }
            return None

class CacheService:
    """Advanced cache service with multiple backends"""
    
    def __init__(self, default_ttl: timedelta = timedelta(hours=1)):
        self.logger = get_logger(self.__class__.__name__)
        self.default_ttl = default_ttl
        self.memory_cache = MemoryCache()
        self.cache_stats = {
            "total_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "total_evictions": 0
        }
        
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        # Create key components
        components = [prefix]
        
        # Add positional arguments
        for arg in args:
            if isinstance(arg, (str, int, float, bool)):
                components.append(str(arg))
            else:
                # Hash complex objects
                components.append(hashlib.md5(str(arg).encode()).hexdigest()[:8])
        
        # Add keyword arguments (sorted for consistency)
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            for k, v in sorted_kwargs:
                components.append(f"{k}={v}")
        
        # Join and hash if too long
        key_string = ":".join(components)
        if len(key_string) > 200:
            key_string = f"{prefix}:{hashlib.md5(key_string.encode()).hexdigest()}"
        
        return key_string
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def get(self, prefix: str, *args, **kwargs) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            prefix (str): Cache key prefix
            *args: Positional arguments for key generation
            **kwargs: Keyword arguments for key generation
            
        Returns:
            Optional[Any]: Cached value or None
        """
        key = self._generate_key(prefix, *args, **kwargs)
        
        try:
            # Try memory cache first
            value = self.memory_cache.get(key)
            if value is not None:
                self.cache_stats["cache_hits"] += 1
                self.logger.debug(f"Cache hit for key: {key}")
                return value
            
            # Cache miss
            self.cache_stats["cache_misses"] += 1
            self.logger.debug(f"Cache miss for key: {key}")
            return None
            
        except Exception as e:
            self.logger.error(f"Cache get error: {e}")
            return None
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def set(self, prefix: str, value: Any, ttl: Optional[timedelta] = None,
                  *args, **kwargs):
        """
        Set value in cache
        
        Args:
            prefix (str): Cache key prefix
            value (Any): Value to cache
            ttl (Optional[timedelta]): Time to live
            *args: Positional arguments for key generation
            **kwargs: Keyword arguments for key generation
        """
        key = self._generate_key(prefix, *args, **kwargs)
        cache_ttl = ttl or self.default_ttl
        
        try:
            self.memory_cache.set(key, value, cache_ttl)
            self.logger.debug(f"Cache set for key: {key}, TTL: {cache_ttl}")
            
        except Exception as e:
            self.logger.error(f"Cache set error: {e}")
    
    @performance_logger
    @handle_errors(log_errors=True, reraise=True)
    async def delete(self, prefix: str, *args, **kwargs) -> bool:
        """
        Delete value from cache
        
        Args:
            prefix (str): Cache key prefix
            *args: Positional arguments for key generation
            **kwargs: Keyword arguments for key generation
            
        Returns:
            bool: True if deleted, False if not found
        """
        key = self._generate_key(prefix, *args, **kwargs)
        
        try:
            deleted = self.memory_cache.delete(key)
            if deleted:
                self.logger.debug(f"Cache deleted for key: {key}")
            return deleted
            
        except Exception as e:
            self.logger.error(f"Cache delete error: {e}")
            return False
    
    @handle_errors(log_errors=True, reraise=True)
    async def get_or_set(self, prefix: str, factory: Callable, ttl: Optional[timedelta] = None,
                         *args, **kwargs) -> Any:
        """
        Get value from cache or set using factory function
        
        Args:
            prefix (str): Cache key prefix
            factory (Callable): Function to generate value if not in cache
            ttl (Optional[timedelta]): Time to live
            *args: Positional arguments for key generation
            **kwargs: Keyword arguments for key generation
            
        Returns:
            Any: Cached or newly generated value
        """
        # Try to get from cache
        value = await self.get(prefix, *args, **kwargs)
        if value is not None:
            return value
        
        # Generate value using factory
        try:
            if asyncio.iscoroutinefunction(factory):
                value = await factory(*args, **kwargs)
            else:
                value = factory(*args, **kwargs)
            
            # Set in cache
            await self.set(prefix, value, ttl, *args, **kwargs)
            
            return value
            
        except Exception as e:
            self.logger.error(f"Factory function error: {e}")
            raise
    
    @handle_errors(log_errors=True, reraise=True)
    async def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate cache entries matching pattern
        
        Args:
            pattern (str): Pattern to match (supports * wildcard)
            
        Returns:
            int: Number of entries invalidated
        """
        keys = self.memory_cache.get_keys()
        invalidated = 0
        
        # Convert pattern to regex
        regex_pattern = pattern.replace('*', '.*')
        
        for key in keys:
            if re.match(regex_pattern, key):
                if await self.delete("", key):  # Use empty prefix since we have full key
                    invalidated += 1
        
        self.logger.info(f"Invalidated {invalidated} cache entries matching pattern: {pattern}")
        return invalidated
    
    @handle_errors(log_errors=True, reraise=True)
    async def clear_all(self):
        """Clear all cache entries"""
        try:
            self.memory_cache.clear()
            self.cache_stats = {
                "total_requests": 0,
                "cache_hits": 0,
                "cache_misses": 0,
                "total_evictions": 0
            }
            self.logger.info("Cache cleared successfully")
            
        except Exception as e:
            self.logger.error(f"Cache clear error: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        memory_stats = self.memory_cache.get_stats()
        
        # Calculate hit rate
        total_requests = self.cache_stats["cache_hits"] + self.cache_stats["cache_misses"]
        hit_rate = (self.cache_stats["cache_hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "cache_stats": self.cache_stats,
            "hit_rate_percent": round(hit_rate, 2),
            "memory_cache": {
                "total_entries": memory_stats.total_entries,
                "total_size_mb": round(memory_stats.total_size_bytes / (1024 * 1024), 2),
                "hit_count": memory_stats.hit_count,
                "miss_count": memory_stats.miss_count,
                "eviction_count": memory_stats.eviction_count,
                "avg_access_time_ms": round(memory_stats.avg_access_time * 1000, 2),
                "oldest_entry": memory_stats.oldest_entry.isoformat() if memory_stats.oldest_entry else None,
                "newest_entry": memory_stats.newest_entry.isoformat() if memory_stats.newest_entry else None
            }
        }
    
    def get_cache_info(self, prefix: str, *args, **kwargs) -> Optional[Dict[str, Any]]:
        """Get detailed information about a cache entry"""
        key = self._generate_key(prefix, *args, **kwargs)
        return self.memory_cache.get_entry_info(key)
    
    async def warm_cache(self, data: Dict[str, Any], ttl: Optional[timedelta] = None):
        """
        Warm cache with predefined data
        
        Args:
            data (Dict[str, Any]): Data to warm cache with
            ttl (Optional[timedelta]): Time to live for entries
        """
        for key, value in data.items():
            try:
                await self.set("warm", value, ttl, key)
            except Exception as e:
                self.logger.warning(f"Failed to warm cache key {key}: {e}")
        
        self.logger.info(f"Cache warmed with {len(data)} entries")

class CacheDecorator:
    """Decorator for caching function results"""
    
    def __init__(self, cache_service: CacheService, ttl: Optional[timedelta] = None,
                 key_prefix: Optional[str] = None):
        self.cache_service = cache_service
        self.ttl = ttl
        self.key_prefix = key_prefix
    
    def __call__(self, func):
        async def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = self.key_prefix or f"func:{func.__name__}"
            
            # Try to get from cache
            cached_result = await self.cache_service.get(prefix, *args, **kwargs)
            if cached_result is not None:
                return cached_result
            
            # Execute function
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # Cache result
            await self.cache_service.set(prefix, result, self.ttl, *args, **kwargs)
            
            return result
        
        return wrapper

# Global cache service instance
cache_service = CacheService()

# Decorator factory
def cached(ttl: Optional[timedelta] = None, key_prefix: Optional[str] = None):
    """Cache decorator factory"""
    def decorator(func):
        return CacheDecorator(cache_service, ttl, key_prefix)(func)
    return decorator

# Dependency injection
def get_cache_service() -> CacheService:
    """Get cache service instance"""
    return cache_service

# Utility functions for specific cache types
@cached(ttl=timedelta(minutes=30), key_prefix="ai_response")
async def cache_ai_response(model_type: str, input_text: str, response: Any):
    """Cache AI responses"""
    return response

@cached(ttl=timedelta(hours=2), key_prefix="irac_analysis")
async def cache_irac_analysis(user_id: str, case_text: str, analysis: Any):
    """Cache IRAC analysis results"""
    return analysis

@cached(ttl=timedelta(hours=1), key_prefix="template_document")
async def cache_template_document(template_id: str, field_values: Dict[str, Any], document: Any):
    """Cache generated documents"""
    return document

@cached(ttl=timedelta(minutes=15), key_prefix="weakness_analysis")
async def cache_weakness_analysis(argument_text: str, analysis: Any):
    """Cache weakness analysis results"""
    return analysis

# Cache management utilities
async def cleanup_expired_cache():
    """Clean up expired cache entries"""
    # This would be called periodically to clean up expired entries
    # For memory cache with TTL, entries are automatically evicted on access
    pass

async def optimize_cache_performance():
    """Optimize cache performance"""
    stats = cache_service.get_stats()
    
    # Log performance metrics
    hit_rate = stats["hit_rate_percent"]
    if hit_rate < 70:
        logger.warning(f"Low cache hit rate: {hit_rate}%")
    
    # Check memory usage
    memory_usage = stats["memory_cache"]["total_size_mb"]
    if memory_usage > 80:  # 80MB
        logger.warning(f"High cache memory usage: {memory_usage}MB")
    
    return stats
