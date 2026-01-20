"""Redis client connection pool for Bonzo agents"""

import redis
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> redis.Redis:
    """Get or create Redis client with connection pool"""
    global _redis_client
    
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/1")
        try:
            _redis_client = redis.from_url(
                redis_url,
                decode_responses=True,
                max_connections=10,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            _redis_client.ping()
            logger.info(f"Connected to Redis at {redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    return _redis_client


def close_redis_client():
    """Close Redis connection"""
    global _redis_client
    if _redis_client:
        _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")
