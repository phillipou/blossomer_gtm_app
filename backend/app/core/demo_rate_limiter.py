import time
import asyncio
import logging
from typing import Optional, Dict, Tuple, Any

try:
    import redis.asyncio as aioredis  # noqa: E402
except ImportError:
    aioredis = None  # type: ignore

logger = logging.getLogger(__name__)


class DemoRateLimiter:
    """
    IP-based rate limiter for demo endpoints. Supports Redis (preferred) and in-memory fallback.
    Configurable per-endpoint and total request limits.
    """

    # Default limits (can be overridden per endpoint)
    DEFAULT_LIMITS: Dict[str, Dict[str, int]] = {
        "company_generate": {
            "limit": 5,
            "window": 3600,
        },  # 5/hr/IP for /company/generate
        "total": {"limit": 10, "window": 3600},  # 10/hr/IP for all demo endpoints
    }

    def __init__(self, redis_url: Optional[str] = None) -> None:
        self.redis_url = redis_url
        self.redis: Optional[Any] = None
        self.in_memory: Dict[str, Dict[str, Any]] = {}
        self.lock = asyncio.Lock()
        if redis_url and aioredis:
            self.redis = aioredis.from_url(
                redis_url, encoding="utf-8", decode_responses=True
            )
        else:
            logger.warning(
                "DemoRateLimiter: Using in-memory fallback (not suitable for production)"
            )

    async def check_limit(
        self,
        ip: str,
        endpoint: str,
        limits: Optional[Dict[str, Dict[str, int]]] = None,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if the IP is within rate limits for the endpoint and total.
        Returns (is_allowed, rate_info_dict)
        """
        limits = limits or self.DEFAULT_LIMITS
        now = int(time.time())
        endpoint_key = f"demo:{endpoint}:{ip}"
        total_key = f"demo:total:{ip}"
        results: Dict[str, Dict[str, Any]] = {}
        allowed = True
        for key, conf in [
            (endpoint_key, limits.get(endpoint, limits["company_generate"])),
            (total_key, limits["total"]),
        ]:
            if self.redis:
                allowed_key, info = await self._check_redis(key, conf, now)
            else:
                allowed_key, info = await self._check_memory(key, conf, now)
            results[key] = info
            if not allowed_key:
                allowed = False
        info = self._compose_rate_info(results, limits, endpoint, now)
        return allowed, info

    async def _check_redis(
        self, key: str, conf: Dict[str, int], now: int
    ) -> Tuple[bool, Dict[str, Any]]:
        assert self.redis is not None
        window = conf["window"]
        limit = conf["limit"]
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.ttl(key)
        res = await pipe.execute()
        count, ttl = res[0], res[1]
        if ttl == -1:
            await self.redis.expire(key, window)
            ttl = window
        allowed = count <= limit
        reset = now + (ttl if ttl > 0 else window)
        info = {
            "limit": limit,
            "remaining": max(0, limit - count),
            "reset": reset,
            "count": count,
        }
        return allowed, info

    async def _check_memory(
        self, key: str, conf: Dict[str, int], now: int
    ) -> Tuple[bool, Dict[str, Any]]:
        async with self.lock:
            window = conf["window"]
            limit = conf["limit"]
            entry = self.in_memory.get(key)
            if not entry or entry["reset"] <= now:
                entry = {"count": 1, "reset": now + window}
            else:
                entry["count"] += 1
            self.in_memory[key] = entry
            self._cleanup_memory(now)
            allowed = entry["count"] <= limit
            info = {
                "limit": limit,
                "remaining": max(0, limit - entry["count"]),
                "reset": entry["reset"],
                "count": entry["count"],
            }
            return allowed, info

    def _cleanup_memory(self, now: int) -> None:
        expired = [k for k, v in self.in_memory.items() if v["reset"] <= now]
        for k in expired:
            del self.in_memory[k]

    def _compose_rate_info(
        self,
        results: Dict[str, Dict[str, Any]],
        limits: Dict[str, Dict[str, int]],
        endpoint: str,
        now: int,
    ) -> Dict[str, Any]:
        infos = list(results.values())
        if not infos:
            return {
                "limit": limits[endpoint]["limit"],
                "remaining": limits[endpoint]["limit"],
                "reset": now + limits[endpoint]["window"],
            }
        min_remaining = min(i["remaining"] for i in infos)
        min_reset = min(i["reset"] for i in infos)
        endpoint_limit = limits.get(endpoint, limits["company_generate"])["limit"]
        return {
            "limit": endpoint_limit,
            "remaining": min_remaining,
            "reset": min_reset,
        }
