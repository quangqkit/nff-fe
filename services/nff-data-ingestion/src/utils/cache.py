import redis
from config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

def cache_set(key: str, value: str, ttl: int = 3600):
    redis_client.set(key, value, ex=ttl)

def cache_get(key: str):
    return redis_client.get(key)